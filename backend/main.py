from fastapi import FastAPI, UploadFile, File, HTTPException
import pandas as pd
import re
import math
from io import BytesIO
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil

from datetime import datetime
from fastapi import HTTPException

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
product_index = {}     # folosit pentru predicții (tuplu)
product_details = {}   # folosit pentru afișarea completă (dicționar)
historical_subs = {}
train_count = {}

# Calea fișierului nomenclator local
LOCAL_NOMENCLATURE_FILE = "data/nomenclature.xlsx"

########################################
# Nomenclature Loading Logic
########################################

def load_nomenclature(filepath=None, df=None):
    """
    Încarcă nomenclatorul fie dintr-un fișier Excel, fie dintr-un DataFrame,
    și actualizează variabilele globale:
      - 'tree' și 'product_index' (tuplu) pentru predicții
      - 'product_details' (dict) pentru afișarea completă în UI
    """
    global tree, product_index, product_details

    if df is None:
        if filepath is None:
            raise ValueError("Trebuie specificat fie filepath, fie df")
        df = pd.read_excel(filepath)

    # Resetăm structurile
    tree = {}
    product_index = {}
    product_details = {}

    for idx, row in df.iterrows():
        # Aici presupunem că ordinea coloanelor din Excel este:
        # 0: ID
        # 1: Articol (nume complet)
        # 2: Piață
        # 3: Segment
        # 4: Categorie
        # 5: Familie
        # 6: Preț
        # 7: Proveniență
        # 8: Premium
        # Ajustează dacă ordinea reală e alta.

        product_code = row.iloc[0]   # ID
        text_value = str(row.iloc[1])  # Articol
        brand_match = re.search(r"BRAND\s*(\d+)", text_value, re.IGNORECASE)
        brand = brand_match.group(1) if brand_match else "N/A"

        market      = row.iloc[2]
        segment     = row.iloc[3]
        category    = row.iloc[4]
        family      = row.iloc[5]
        price       = row.iloc[6]
        origin      = row.iloc[7]
        premium     = row.iloc[8]

        # 1) Actualizăm structura 'tree' + 'product_index' (pentru predicții)
        tree.setdefault(market, {}).setdefault(segment, {})\
            .setdefault(category, {}).setdefault(family, []).append(product_code)

        # Tuplu pentru codul de predicție
        product_index[product_code] = (
            market, segment, category, family, brand, price, origin, premium
        )

        # 2) Actualizăm 'product_details' cu TOT ce vrei să afișezi în UI
        product_details[product_code] = {
            "ID": product_code,
            "Articol": text_value,
            "Piata": market,
            "Segment": segment,
            "Categorie": category,
            "Familie": family,
            "Pret": price,
            "Provenienta": origin,
            "Premium": premium,
            # Păstrăm și brand-ul dacă vrei să-l afișezi ulterior
            "Brand": brand,
        }

# La startup, dacă fișierul nomenclator există local, îl încărcăm
if os.path.exists(LOCAL_NOMENCLATURE_FILE):
    try:
        load_nomenclature(filepath=LOCAL_NOMENCLATURE_FILE)
        print("Nomenclatorul a fost încărcat de pe disc.")
    except Exception as e:
        print("Eroare la încărcarea nomenclatorului:", e)
else:
    print("Nomenclatorul nu există încă. Așteptăm upload-ul.")

@app.post("/load-nomenclature")
async def api_load_nomenclature(file: UploadFile = File(...)):
    try:
        os.makedirs("data", exist_ok=True)
        # Salvează fișierul uploadat pe disc
        with open(LOCAL_NOMENCLATURE_FILE, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        # Încarcă nomenclatorul din fișierul salvat
        load_nomenclature(filepath=LOCAL_NOMENCLATURE_FILE)
        return {"message": "Nomenclature loaded and saved successfully!"}
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

########################################
# Nomenclature Info and Clear Endpoints
########################################

@app.get("/nomenclature-info")
def nomenclature_info():
    if os.path.exists(LOCAL_NOMENCLATURE_FILE):
        # Obține timestamp-ul ultimei modificări
        last_upload_ts = os.path.getmtime(LOCAL_NOMENCLATURE_FILE)
        last_upload = datetime.fromtimestamp(last_upload_ts).strftime("%Y-%m-%d %H:%M:%S")
        # Numărul de produse, folosind datele încărcate în memorie
        product_count = len(product_details)  # sau len(product_index)
        # Construim un array de obiecte cu toată informația
        # (ID, Articol, Piață, Segment, Categorie, Familie, Preț, Proveniență, Premium etc.)
        products_list = list(product_details.values())

        return {
            "exists": True,
            "lastUpload": last_upload,
            "productCount": product_count,
            "products": products_list
        }
    else:
        return {"exists": False}

@app.delete("/clear-nomenclature")
def clear_nomenclature():
    if os.path.exists(LOCAL_NOMENCLATURE_FILE):
        try:
            os.remove(LOCAL_NOMENCLATURE_FILE)
            # Resetăm variabilele globale
            global tree, product_index, product_details
            tree = {}
            product_index = {}
            product_details = {}
            return {"message": "Nomenclature cleared successfully."}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        raise HTTPException(status_code=404, detail="Nomenclature file not found.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
