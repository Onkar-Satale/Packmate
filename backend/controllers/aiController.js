import axios from 'axios';
import ApiError from '../utils/ApiError.js';

const genaiUrl = process.env.GENAI_SERVICE_URL;
const genaiApiSecret = process.env.GENAI_API_SECRET;

const handleAxiosError = (err, next) => {
  if (err.response) {
    const msg = err.response.data?.detail || err.response.data?.error || 'GenAI Error';
    return next(new ApiError(err.response.status, msg, true, err.stack));
  }
  return next(new ApiError(500, 'Failed to communicate with GenAI service', false, err.stack));
};

export const prefetchWeather = async (req, res, next) => {
  try {
    const response = await axios.post(`${genaiUrl}/prefetch-weather`, req.body, {
      headers: { 'x-api-key': genaiApiSecret }
    });
    res.json(response.data);
  } catch (err) {
    handleAxiosError(err, next);
  }
};

export const generatePackingList = async (req, res, next) => {
  try {
    const response = await axios.post(`${genaiUrl}/generate-packing-list`, req.body, {
      headers: { 'x-api-key': genaiApiSecret }
    });
    res.json(response.data);
  } catch (err) {
    handleAxiosError(err, next);
  }
};

export const downloadPackingList = async (req, res, next) => {
  try {
    const response = await axios.post(`${genaiUrl}/download-packing-list`, req.body, {
      headers: { 'x-api-key': genaiApiSecret },
      responseType: 'stream'
    });
    
    // Pass headers specific to the file download from FastAPI
    res.set({
      'Content-Disposition': response.headers['content-disposition'],
      'Content-Type': response.headers['content-type'],
    });

    response.data.pipe(res);
  } catch (err) {
    handleAxiosError(err, next);
  }
};

export const analyzeSuitcase = async (req, res, next) => {
  try {
    const response = await axios.post(`${genaiUrl}/analyze-suitcase`, req.body, {
      headers: { 'x-api-key': genaiApiSecret }
    });
    res.json(response.data);
  } catch (err) {
    handleAxiosError(err, next);
  }
};

export const chat = async (req, res, next) => {
  try {
    const response = await axios.post(`${genaiUrl}/chat`, req.body, {
      headers: { 'x-api-key': genaiApiSecret }
    });
    res.json(response.data);
  } catch (err) {
    handleAxiosError(err, next);
  }
};

export const travelChat = async (req, res, next) => {
  try {
    const response = await axios.post(`${genaiUrl}/travel-chat`, req.body, {
      headers: { 'x-api-key': genaiApiSecret }
    });
    res.json(response.data);
  } catch (err) {
    handleAxiosError(err, next);
  }
};

export const debugRag = async (req, res, next) => {
  try {
    const response = await axios.get(`${genaiUrl}/debug-rag`, {
      headers: { 'x-api-key': genaiApiSecret }
    });
    res.json(response.data);
  } catch (err) {
    handleAxiosError(err, next);
  }
};

