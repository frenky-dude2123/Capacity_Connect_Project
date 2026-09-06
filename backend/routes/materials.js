const express = require('express');
const router = express.Router();
const { isSupabaseAvailable, supabase, authMiddleware, requireRole } = require('../lib/supabaseClient');

// In-memory fallback storage for demo/hackathon mode
const IN_MEMORY_MATERIALS = [];

// In-memory courses fallback (matches frontend mock data)
const FALLBACK_COURSES = [
  { id: 1, title: "Cloud Infrastructure & High-Availability Scaling", category: "Cloud", description: "Deep dive into high-availability architectures", instructor: "Elena Rostova" },
  { id: 2, title: "Enterprise Data Governance & ISO 27001 Security", category: "Security", description: "Data governance and compliance framework", instructor: "Elena Rostova" },
  { id: 3, title: "Distributed Systems Design & Microservices Engineering", category: "Engineering", description: "Design patterns for distributed systems", instructor: "Elena Rostova" }
];

/**
 * GET /api/materials/courses
 * Protected: trainer only.
 * Returns all courses.
 */
router.get('/courses', authMiddleware, requireRole('trainer'), async (req, res) => {
  try {
    if (!isSupabaseAvailable) {
      return res.json(FALLBACK_COURSES);
    }

    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.warn('[Materials] Courses error, falling back:', error.message);
      return res.json(FALLBACK_COURSES);
    }

    res.json(courses || []);
  } catch (err) {
    console.error('[Materials] Courses exception:', err.message);
    res.json(FALLBACK_COURSES);
  }
});

/**
 * GET /api/materials/my-materials
 * Protected: trainer only.
 * Returns all materials uploaded by the current trainer.
 */
router.get('/my-materials', authMiddleware, requireRole('trainer'), async (req, res) => {
  try {
    const trainerId = req.user.id;

    if (!isSupabaseAvailable) {
      const myMats = IN_MEMORY_MATERIALS.filter(m => m.trainer_id === trainerId && m.is_active);
      return res.json(myMats);
    }

    const { data: materials, error } = await supabase
      .from('materials')
      .select('*')
      .eq('trainer_id', trainerId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Materials] My materials Supabase error, using in-memory fallback:', error.message);
      const myMats = IN_MEMORY_MATERIALS.filter(m => m.trainer_id === trainerId && m.is_active);
      return res.json(myMats);
    }

    res.json(materials || []);
  } catch (err) {
    console.error('[Materials] My materials exception:', err.message);
    const trainerId = req.user.id;
    const myMats = IN_MEMORY_MATERIALS.filter(m => m.trainer_id === trainerId && m.is_active);
    res.json(myMats);
  }
});

/**
 * POST /api/materials
 * Protected: trainer only.
 * Creates a new material (video URL, notes, or document link).
 */
router.post('/', authMiddleware, requireRole('trainer'), async (req, res) => {
  try {
    const trainerId = req.user.id;
    const { course_id, type, title, description, url, content, file_name, mime_type, file_size } = req.body;

    if (!course_id || !type || !title) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'course_id, type, and title are required.'
      });
    }

    const validTypes = ['video', 'notes', 'document'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'type must be one of: ' + validTypes.join(', ')
      });
    }

    if (!isSupabaseAvailable) {
      const newMaterial = {
        id: 'mat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        course_id: Number(course_id),
        trainer_id: trainerId,
        type,
        title: title.trim(),
        description: description || null,
        url: url || null,
        content: content || null,
        file_name: file_name || null,
        file_size: file_size || null,
        mime_type: mime_type || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      IN_MEMORY_MATERIALS.push(newMaterial);
      return res.status(201).json({
        message: 'Material created successfully',
        material: newMaterial
      });
    }

    const { data, error } = await supabase
      .from('materials')
      .insert({
        course_id: Number(course_id),
        trainer_id: trainerId,
        type,
        title: title.trim(),
        description: description || null,
        url: url || null,
        content: content || null,
        file_name: file_name || null,
        file_size: file_size || null,
        mime_type: mime_type || null,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.warn('[Materials] Create Supabase error, using in-memory fallback:', error.message);
      const newMaterial = {
        id: 'mat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        course_id: Number(course_id),
        trainer_id: trainerId,
        type,
        title: title.trim(),
        description: description || null,
        url: url || null,
        content: content || null,
        file_name: file_name || null,
        file_size: file_size || null,
        mime_type: mime_type || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      IN_MEMORY_MATERIALS.push(newMaterial);
      return res.status(201).json({
        message: 'Material created successfully',
        material: newMaterial
      });
    }

    res.status(201).json({
      message: 'Material created successfully',
      material: data
    });
  } catch (err) {
    console.error('[Materials] Create exception:', err.message);
    res.status(500).json({ error: 'Failed to create material', details: err.message });
  }
});

/**
 * DELETE /api/materials/:id
 * Protected: trainer only.
 */
router.delete('/:id', authMiddleware, requireRole('trainer'), async (req, res) => {
  try {
    const trainerId = req.user.id;
    const { id } = req.params;

    if (!isSupabaseAvailable) {
      const idx = IN_MEMORY_MATERIALS.findIndex(m => m.id === id && m.trainer_id === trainerId);
      if (idx !== -1) IN_MEMORY_MATERIALS[idx].is_active = false;
      return res.json({ message: 'Material deleted successfully' });
    }

    const { error } = await supabase
      .from('materials')
      .update({ is_active: false })
      .eq('id', id)
      .eq('trainer_id', trainerId);

    if (error) {
      console.warn('[Materials] Delete Supabase error, using in-memory fallback:', error.message);
      const idx = IN_MEMORY_MATERIALS.findIndex(m => m.id === id && m.trainer_id === trainerId);
      if (idx !== -1) IN_MEMORY_MATERIALS[idx].is_active = false;
    }

    res.json({ message: 'Material deleted successfully' });
  } catch (err) {
    console.error('[Materials] Delete exception:', err.message);
    res.status(500).json({ error: 'Failed to delete material', details: err.message });
  }
});

/**
 * GET /api/materials/course/:courseId
 * Protected: trainee, trainer.
 */
router.get('/course/:courseId', authMiddleware, requireRole('trainee', 'trainer'), async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!isSupabaseAvailable) {
      const courseMats = IN_MEMORY_MATERIALS.filter(
        m => m.course_id === Number(courseId) && m.is_active
      );
      return res.json(courseMats);
    }

    const { data: materials, error } = await supabase
      .from('materials')
      .select('*')
      .eq('course_id', Number(courseId))
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Materials] Course materials Supabase error, using in-memory fallback:', error.message);
      const courseMats = IN_MEMORY_MATERIALS.filter(
        m => m.course_id === Number(courseId) && m.is_active
      );
      return res.json(courseMats);
    }

    res.json(materials || []);
  } catch (err) {
    console.error('[Materials] Course materials exception:', err.message);
    const courseMats = IN_MEMORY_MATERIALS.filter(
      m => m.course_id === Number(req.params.courseId) && m.is_active
    );
    res.json(courseMats);
  }
});

module.exports = router;
