const Course = require('../models/Course');
const Cart = require('../models/Cart');
const Enrollment = require('../models/Enrollment');

class CourseService {
  
  /**
   * Get all active courses with unified data structure
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @param {String} userRole - Role of requesting user (admin, user)
   * @returns {Object} Courses data with metadata
   */
  async getAllCourses(filters = {}, pagination = {}, userRole = 'user') {
    try {
      const { 
        category, 
        level, 
        status = 'Published',
        featured,
        trending,
        search 
      } = filters;
      
      const { 
        page = 1, 
        limit = 10,
        sort = '-createdAt' 
      } = pagination;

      // Build query
      const query = {
        isActive: true
      };

      if (userRole !== 'admin') {
        query.status = 'Published';
      }

      if (category) query.category = category;
      if (level) query.level = level;
      if (status && userRole === 'admin') query.status = status;
      if (featured !== undefined) query.featured = featured;
      if (trending !== undefined) query.trending = trending;
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      // Execute query with pagination
      const courses = await Course.find(query)
        .populate('instructor', 'firstName lastName email')
        .select(userRole === 'admin' ? '' : '-lessons.content') // Hide lesson content for non-admin
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Course.countDocuments(query);

      return {
        success: true,
        data: {
          courses,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit,
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1
          },
          meta: {
            totalActive: await Course.countDocuments({ isActive: true, status: 'Published' }),
            totalDrafts: userRole === 'admin' ? await Course.countDocuments({ status: 'Draft' }) : 0,
            categories: await this.getCourseCategories(),
            levels: await this.getCourseLevels()
          }
        }
      };

    } catch (error) {
      console.error('CourseService.getAllCourses error:', error);
      throw error;
    }
  }

  /**
   * Get single course by ID with role-based access
   * @param {String} courseId - Course ID
   * @param {String} userId - User ID (optional)
   * @param {String} userRole - User role
   * @returns {Object} Course data with enrollment status
   */
  async getCourseById(courseId, userId = null, userRole = 'user') {
    try {
      const course = await Course.findById(courseId)
        .populate('instructor', 'firstName lastName email avatar')
        .populate('reviews.user', 'firstName lastName avatar');

      if (!course) {
        return {
          success: false,
          message: 'Course not found'
        };
      }

      // Check access permissions
      if (userRole !== 'admin' && (!course.isActive || course.status !== 'Published')) {
        return {
          success: false,
          message: 'Course not available'
        };
      }

      let enrollmentStatus = null;
      let cartStatus = null;

      // Check enrollment and cart status if user is logged in
      if (userId) {
        // Check if user is enrolled
        const enrollment = await Enrollment.findOne({
          user: userId,
          course: courseId
        });

        if (enrollment) {
          enrollmentStatus = {
            isEnrolled: true,
            enrollmentDate: enrollment.enrollmentDate,
            progress: enrollment.progress,
            completionDate: enrollment.completionDate,
            status: enrollment.status
          };
        }

        // Check if course is in cart
        const cart = await Cart.findOne({ user: userId });
        if (cart) {
          const inCart = cart.courses.some(item => 
            item.course.toString() === courseId
          );
          cartStatus = { inCart };
        }
      }

      // Prepare course data based on user role and enrollment
      const courseData = {
        ...course.toObject(),
        enrollmentStatus,
        cartStatus
      };

      // Filter lessons content based on enrollment for non-admin users
      if (userRole !== 'admin' && !enrollmentStatus?.isEnrolled) {
        courseData.lessons = courseData.lessons?.map(lesson => ({
          _id: lesson._id,
          title: lesson.title,
          duration: lesson.duration,
          order: lesson.order,
          type: lesson.type,
          isPreview: lesson.isPreview || false,
          // Hide content for non-enrolled users
          content: lesson.isPreview ? lesson.content : 'Content available after enrollment'
        }));
      }

      return {
        success: true,
        data: courseData
      };

    } catch (error) {
      console.error('CourseService.getCourseById error:', error);
      throw error;
    }
  }

  /**
   * Get course categories
   */
  async getCourseCategories() {
    try {
      return await Course.distinct('category', { isActive: true, status: 'Published' });
    } catch (error) {
      console.error('CourseService.getCourseCategories error:', error);
      return [];
    }
  }

  /**
   * Get course levels
   */
  async getCourseLevels() {
    try {
      return await Course.distinct('level', { isActive: true, status: 'Published' });
    } catch (error) {
      console.error('CourseService.getCourseLevels error:', error);
      return [];
    }
  }

  /**
   * Get featured courses
   */
  async getFeaturedCourses(limit = 6) {
    try {
      const courses = await Course.find({
        isActive: true,
        status: 'Published',
        featured: true
      })
      .populate('instructor', 'firstName lastName')
      .select('-lessons.content')
      .sort('-createdAt')
      .limit(limit);

      return {
        success: true,
        data: courses
      };
    } catch (error) {
      console.error('CourseService.getFeaturedCourses error:', error);
      throw error;
    }
  }

  /**
   * Get trending courses
   */
  async getTrendingCourses(limit = 6) {
    try {
      const courses = await Course.find({
        isActive: true,
        status: 'Published',
        trending: true
      })
      .populate('instructor', 'firstName lastName')
      .select('-lessons.content')
      .sort('-totalStudents')
      .limit(limit);

      return {
        success: true,
        data: courses
      };
    } catch (error) {
      console.error('CourseService.getTrendingCourses error:', error);
      throw error;
    }
  }

  /**
   * Get course statistics
   */
  async getCourseStats() {
    try {
      const stats = await Course.aggregate([
        {
          $group: {
            _id: null,
            totalCourses: { $sum: 1 },
            activeCourses: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ['$isActive', true] }, { $eq: ['$status', 'Published'] }] },
                  1,
                  0
                ]
              }
            },
            draftCourses: {
              $sum: {
                $cond: [{ $eq: ['$status', 'Draft'] }, 1, 0]
              }
            },
            totalEnrollments: { $sum: '$totalStudents' },
            averagePrice: { $avg: '$price' },
            averageRating: { $avg: '$rating' }
          }
        }
      ]);

      const categoryStats = await Course.aggregate([
        { $match: { isActive: true, status: 'Published' } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      const levelStats = await Course.aggregate([
        { $match: { isActive: true, status: 'Published' } },
        { $group: { _id: '$level', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      return {
        success: true,
        data: {
          overall: stats[0] || {
            totalCourses: 0,
            activeCourses: 0,
            draftCourses: 0,
            totalEnrollments: 0,
            averagePrice: 0,
            averageRating: 0
          },
          byCategory: categoryStats,
          byLevel: levelStats
        }
      };
    } catch (error) {
      console.error('CourseService.getCourseStats error:', error);
      throw error;
    }
  }

  /**
   * Search courses with advanced filters
   */
  async searchCourses(searchQuery, filters = {}, userId = null) {
    try {
      const {
        category,
        level,
        priceRange,
        rating,
        duration,
        sort = 'relevance'
      } = filters;

      const query = {
        isActive: true,
        status: 'Published'
      };

      // Text search
      if (searchQuery) {
        query.$text = { $search: searchQuery };
      }

      // Additional filters
      if (category) query.category = category;
      if (level) query.level = level;
      if (rating) query.rating = { $gte: rating };

      if (priceRange) {
        if (priceRange.min !== undefined) query.price = { ...query.price, $gte: priceRange.min };
        if (priceRange.max !== undefined) query.price = { ...query.price, $lte: priceRange.max };
      }

      if (duration) {
        if (duration.min !== undefined) query.duration = { ...query.duration, $gte: duration.min };
        if (duration.max !== undefined) query.duration = { ...query.duration, $lte: duration.max };
      }

      let sortQuery = {};
      switch (sort) {
        case 'price_low':
          sortQuery = { price: 1 };
          break;
        case 'price_high':
          sortQuery = { price: -1 };
          break;
        case 'rating':
          sortQuery = { rating: -1 };
          break;
        case 'newest':
          sortQuery = { createdAt: -1 };
          break;
        case 'popular':
          sortQuery = { totalStudents: -1 };
          break;
        default:
          sortQuery = searchQuery ? { score: { $meta: 'textScore' } } : { createdAt: -1 };
      }

      const courses = await Course.find(query)
        .populate('instructor', 'firstName lastName')
        .select('-lessons.content')
        .sort(sortQuery)
        .limit(20);

      return {
        success: true,
        data: {
          courses,
          totalResults: courses.length,
          searchQuery,
          filters
        }
      };

    } catch (error) {
      console.error('CourseService.searchCourses error:', error);
      throw error;
    }
  }
}

module.exports = new CourseService();