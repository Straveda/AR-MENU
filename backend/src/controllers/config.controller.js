import { NOMENCLATURE } from '../config/nomenclature.config.js';

export const getNomenclature = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: NOMENCLATURE,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch nomenclature',
      error: error.message,
    });
  }
};
