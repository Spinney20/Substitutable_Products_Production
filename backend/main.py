from fastapi import FastAPI, UploadFile, File
import pandas as pd
import re
import math
from io import BytesIO
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # sau specific "http://localhost:5173"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global storages
tree = {}
product_index = {}
historical_subs = {}
train_count = {}

########################################
# Nomenclature Loading Logic
########################################

def load_nomenclature(filepath=None, df=None):
    global tree, product_index
    if df is None:
        df = pd.read_excel(filepath)
    tree = {}
    product_index = {}

    for idx, row in df.iterrows():
        product_code = row.iloc[0]
        text_value = str(row.iloc[1])
        brand_match = re.search(r"BRAND\s*(\d+)", text_value, re.IGNORECASE)
        brand = brand_match.group(1) if brand_match else "N/A"

        market, segment, category, family = row.iloc[2:6]
        price, origin, premium = row.iloc[6:9]

        tree.setdefault(market, {}).setdefault(segment, {}).setdefault(category, {}).setdefault(family, []).append(product_code)

        product_index[product_code] = (
            market, segment, category, family, brand, price, origin, premium
        )

@app.post("/load-nomenclature")
async def api_load_nomenclature(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        df = pd.read_excel(BytesIO(contents))
        load_nomenclature(df=df)
        return {"message": "Nomenclature loaded successfully!"}
    except Exception as e:
        return {"error": str(e)}

########################################
# Prediction Logic
########################################

def compute_price_score(base_price, candidate_price):
    if base_price == 0:
        return 0
    ratio = candidate_price / base_price
    if ratio <= 0.25 or ratio >= 2:
        return 0
    elif 0.25 < ratio <= 1:
        return 40 * ((ratio - 0.25) / 0.75)
    elif 1 < ratio < 2:
        return 40 * ((2 - ratio) / 1)
    return 0

def compute_confidence(product_A, candidate):
    _, _, _, famA, brandA, priceA, originA, premA = product_index[product_A]
    _, _, _, famC, brandC, priceC, originC, premC = product_index[candidate]

    price_score = compute_price_score(priceA, priceC)
    brand_score = 40 if brandA == brandC else 0
    origin_score = 10 if originA == originC else 0
    premium_score = 10 if premA == premC else 0

    attr_total = price_score + brand_score + origin_score + premium_score
    attr_multiplier = 1.0 if famA == famC else 0.5
    attribute_conf = attr_total * attr_multiplier

    real_conf = 100 if (product_A, candidate) in historical_subs else 0
    train_days = train_count.get(product_A, 0)
    alpha = min(0.5 + 0.5 * (train_days - 1), 1.0) if train_days > 0 else 0.0

    return attribute_conf * (1 - alpha) + real_conf * alpha

def softmax_confidences(confidences, temperature=20):
    exps = {cand: math.exp(score / temperature) for cand, score in confidences.items()}
    total = sum(exps.values())
    return {cand: (exps[cand] / total) * 100 if total > 0 else 0 for cand in exps}

def get_substitutes_with_confidence(product_code):
    mar, seg, cat, fam, brand, price, origin, prem = product_index[product_code]
    family_candidates = [p for p in tree[mar][seg][cat][fam] if p != product_code]

    category_candidates = []
    for f_key, products in tree[mar][seg][cat].items():
        if f_key != fam:
            category_candidates.extend(
                [p for p in products if product_index[p][4] == brand]
            )

    substitutes = list(set(family_candidates + category_candidates))
    confidences = {cand: compute_confidence(product_code, cand) for cand in substitutes}
    return substitutes, confidences

@app.get("/predict/{product_id}")
def predict(product_id: int):
    try:
        if product_id not in product_index:
            return {"error": "Product not found"}
        substitutes, confidences = get_substitutes_with_confidence(product_id)
        probabilities = softmax_confidences(confidences)

        return {
            "product_id": product_id,
            "substitutes": substitutes,
            "confidences": confidences,
            "probabilities": probabilities
        }
    except Exception as e:
        return {"error": str(e)}

########################################
# Training Logic
########################################

@app.post("/train/")
def train_model(data: dict):
    global historical_subs, train_count

    product_out_id = data["product_out_id"]
    zero_stock_data = data["zero_stock_data"]

    for entry in zero_stock_data:
        real_sub = entry["real_sub"]
        key = (product_out_id, real_sub)
        historical_subs[key] = historical_subs.get(key, 0) + 1
        train_count[product_out_id] = train_count.get(product_out_id, 0) + 1

    return {"message": f"Trained product {product_out_id}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
