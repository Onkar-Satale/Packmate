const axios = require('axios');
const ApiError = require('../utils/ApiError');

const genaiUrl = process.env.GENAI_SERVICE_URL;
const genaiApiSecret = process.env.GENAI_API_SECRET;

exports.prefetchWeather = async (req, res, next) => {
  try {
    const response = await axios.post(`${genaiUrl}/prefetch-weather`, req.body, {
      headers: { 'x-api-key': genaiApiSecret }
    });
    res.json(response.data);
  } catch (err) {
    if (err.response) {
      const msg = err.response.data.detail || err.response.data.error || 'GenAI Error';
      return next(new ApiError(err.response.status, msg));
    }
    console.error("GenAI Communication Error:", err.message);
    next(new ApiError(500, 'Failed to communicate with GenAI service'));
  }
};

exports.generatePackingList = async (req, res, next) => {
  try {
    const response = await axios.post(`${genaiUrl}/generate-packing-list`, req.body, {
      headers: { 'x-api-key': genaiApiSecret }
    });
    res.json(response.data);
  } catch (err) {
    if (err.response) {
      return next(new ApiError(err.response.status, err.response.data.detail || 'GenAI Error'));
    }
    console.error("GenAI Communication Error:", err.message);
    next(new ApiError(500, 'Failed to communicate with GenAI service'));
  }
};

exports.downloadPackingList = async (req, res, next) => {
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
    if (err.response) {
      return next(new ApiError(err.response.status, err.response.data.detail || 'GenAI Error'));
    }
    console.error("GenAI Communication Error:", err.message);
    next(new ApiError(500, 'Failed to communicate with GenAI service'));
  }
};

exports.analyzeSuitcase = async (req, res, next) => {
  try {
    const response = await axios.post(`${genaiUrl}/analyze-suitcase`, req.body, {
      headers: { 'x-api-key': genaiApiSecret }
    });
    res.json(response.data);
  } catch (err) {
    if (err.response) {
      return next(new ApiError(err.response.status, err.response.data.detail || 'GenAI Error'));
    }
    console.error("GenAI Communication Error:", err.message);
    next(new ApiError(500, 'Failed to communicate with GenAI service'));
  }
};

exports.chat = async (req, res, next) => {
  try {
    const response = await axios.post(`${genaiUrl}/chat`, req.body, {
      headers: { 'x-api-key': genaiApiSecret }
    });
    res.json(response.data);
  } catch (err) {
    if (err.response) {
      return next(new ApiError(err.response.status, err.response.data.detail || 'GenAI Error'));
    }
    console.error("GenAI Communication Error:", err.message);
    next(new ApiError(500, 'Failed to communicate with GenAI service'));
  }
};

exports.travelChat = async (req, res, next) => {
  try {
    const response = await axios.post(`${genaiUrl}/travel-chat`, req.body, {
      headers: { 'x-api-key': genaiApiSecret }
    });
    res.json(response.data);
  } catch (err) {
    if (err.response) {
      return next(new ApiError(err.response.status, err.response.data.detail || 'GenAI Error'));
    }
    console.error("GenAI Communication Error:", err.message);
    next(new ApiError(500, 'Failed to communicate with GenAI service'));
  }
};
