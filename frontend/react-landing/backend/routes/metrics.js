const express = require('express');
const Story = require('../models/Story');
const File = require('../models/File');

const router = express.Router();

// GET /api/metrics/summary
router.get('/summary', async (req, res) => {
  console.log('📊 Metrics summary endpoint called');
  try {
    const [totalStories, totalAnalyzedFiles, viewsAgg] = await Promise.all([
      Story.countDocuments({}),
      File.countDocuments({ status: 'completed' }),
      Story.aggregate([{ $group: { _id: null, totalViews: { $sum: '$views' } } }])
    ]);

    const totalViews = viewsAgg && viewsAgg.length > 0 ? viewsAgg[0].totalViews : 0;

    // Simple satisfaction proxy: percentage of stories with at least one like
    let userSatisfaction = 0;
    if (totalStories > 0) {
      const likedStories = await Story.countDocuments({ likes: { $gt: 0 } });
      userSatisfaction = Math.round((likedStories / totalStories) * 100);
    }

    res.json({
      totalStories,
      totalAnalyzedFiles,
      totalViews,
      userSatisfaction
    });
  } catch (error) {
    console.error('❌ Metrics summary error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      message: 'Failed to get metrics summary',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;


