const express = require('express');
const router = express.Router();
const { isSupabaseAvailable, supabase } = require('../lib/supabaseClient');

/**
 * 1. GET /api/courses/catalog
 * Returns list of all courses from Supabase.
 */
router.get('/catalog', async (req, res) => {
  try {
    if (!isSupabaseAvailable) {
      return res.status(500).json({ error: 'Database not configured', details: 'Supabase is not available' });
    }

    const { data, error } = await supabase
      .from('courses')
      .select('id, title, category, description, instructor')
      .order('id', { ascending: true });

    if (error) {
      console.error('[Courses] Catalog error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch course catalog', details: error.message });
    }

    res.json(data || []);
  } catch (err) {
    console.error('[Courses] Catalog exception:', err.message);
    res.status(500).json({ error: 'Failed to fetch course catalog', details: err.message });
  }
});

/**
 * 2. GET /api/courses/detail/:id
 * Returns specific course info from Supabase.
 */
router.get('/detail/:id', async (req, res) => {
  try {
    if (!isSupabaseAvailable) {
      return res.status(500).json({ error: 'Database not configured', details: 'Supabase is not available' });
    }

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        error: 'Course not found',
        message: `No course exists with ID: ${req.params.id}`
      });
    }

    res.json({
      id: data.id,
      title: data.title,
      category: data.category,
      description: data.description,
      syllabus: data.syllabus || [],
      instructor: data.instructor
    });
  } catch (err) {
    console.error('[Courses] Detail error:', err.message);
    res.status(500).json({ error: 'Failed to fetch course detail', details: err.message });
  }
});

/**
 * 3. GET /api/courses/player/:id
 * Returns lesson player data from Supabase.
 */
router.get('/player/:id', async (req, res) => {
  try {
    if (!isSupabaseAvailable) {
      return res.status(500).json({ error: 'Database not configured', details: 'Supabase is not available' });
    }

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        error: 'Course not found',
        message: `No course exists with ID: ${req.params.id}`
      });
    }

    res.json({
      id: data.id,
      title: data.title,
      videoUrl: data.video_url,
      readingContent: data.reading_content,
      quiz: data.quiz || null,
      syllabus: data.syllabus || []
    });
  } catch (err) {
    console.error('[Courses] Player error:', err.message);
    res.status(500).json({ error: 'Failed to fetch course player data', details: err.message });
  }
});

module.exports = router;
