import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000';

export const uploadNomenclature = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  return axios.post(`${BASE_URL}/load-nomenclature`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const predictSubstitutes = async (productId) => {
  return axios.get(`${BASE_URL}/predict/${productId}`);
};
