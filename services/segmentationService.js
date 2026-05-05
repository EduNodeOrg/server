const User = require('../models/User');
const Unsubscribe = require('../models/Unsubscribe');

class SegmentationService {
  
  async getSegmentedUsers(segments, options = {}) {
    try {
      let query = this.buildBaseQuery(options);
      
      // Apply each segment filter
      for (const segment of segments) {
        query = this.applySegmentFilter(query, segment);
      }

      // Execute query with pagination if needed
      const { page = 1, limit = 1000, sortBy = 'date', sortOrder = -1 } = options;
      
      const users = await User.find(query)
        .select('_id email name role university skills preferences location date Points rating emailPreferences')
        .sort({ [sortBy]: sortOrder })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      // Filter out unsubscribed users
      const filteredUsers = await this.filterUnsubscribedUsers(users);
      
      return {
        users: filteredUsers,
        userIds: filteredUsers.map(user => user._id),
        totalCount: await User.countDocuments(query)
      };

    } catch (error) {
      console.error('Error in getSegmentedUsers:', error);
      throw error;
    }
  }

  buildBaseQuery(options = {}) {
    let query = { 
      email: { $exists: true, $ne: null, $ne: '' },
      isVerified: true
    };

    // Add email preference filtering
    if (options.includeUnsubscribed !== true) {
      query['emailPreferences.marketing'] = true;
    }

    // Add date range filtering
    if (options.dateFrom || options.dateTo) {
      query.date = {};
      if (options.dateFrom) {
        query.date.$gte = new Date(options.dateFrom);
      }
      if (options.dateTo) {
        query.date.$lte = new Date(options.dateTo);
      }
    }

    return query;
  }

  applySegmentFilter(query, segment) {
    switch (segment.type) {
      case 'role':
        return this.applyRoleFilter(query, segment.criteria);
      
      case 'activity':
        return this.applyActivityFilter(query, segment.criteria);
      
      case 'skills':
        return this.applySkillsFilter(query, segment.criteria);
      
      case 'preferences':
        return this.applyPreferencesFilter(query, segment.criteria);
      
      case 'courses':
        return this.applyCoursesFilter(query, segment.criteria);
      
      case 'location':
        return this.applyLocationFilter(query, segment.criteria);
      
      case 'engagement':
        return this.applyEngagementFilter(query, segment.criteria);
      
      case 'demographics':
        return this.applyDemographicsFilter(query, segment.criteria);
      
      case 'custom':
        return this.applyCustomFilter(query, segment.criteria);
      
      default:
        console.warn(`Unknown segment type: ${segment.type}`);
        return query;
    }
  }

  applyRoleFilter(query, criteria) {
    if (criteria.roles && criteria.roles.length > 0) {
      query.role = { $in: criteria.roles };
    }
    return query;
  }

  applyActivityFilter(query, criteria) {
    if (criteria.lastLoginDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - criteria.lastLoginDays);
      query.date = { ...query.date, $gte: cutoffDate };
    }

    if (criteria.minPoints) {
      query.Points = { $gte: criteria.minPoints };
    }

    if (criteria.maxPoints) {
      query.Points = { ...query.Points, $lte: criteria.maxPoints };
    }

    if (criteria.hasCompletedCourse) {
      query.courseOneDone = true;
    }

    return query;
  }

  applySkillsFilter(query, criteria) {
    if (criteria.skills && criteria.skills.length > 0) {
      if (criteria.matchType === 'any') {
        query.skills = { $in: criteria.skills };
      } else if (criteria.matchType === 'all') {
        query.skills = { $all: criteria.skills };
      }
    }

    if (criteria.minSkillsCount) {
      query['skills.0'] = { $exists: true };
      if (criteria.minSkillsCount > 0) {
        query.$expr = { $gte: [{ $size: '$skills' }, criteria.minSkillsCount] };
      }
    }

    return query;
  }

  applyPreferencesFilter(query, criteria) {
    if (criteria.preferences && criteria.preferences.length > 0) {
      if (criteria.matchType === 'any') {
        query.preferences = { $in: criteria.preferences };
      } else if (criteria.matchType === 'all') {
        query.preferences = { $all: criteria.preferences };
      }
    }

    return query;
  }

  applyCoursesFilter(query, criteria) {
    if (criteria.enrolledInCourses && criteria.enrolledInCourses.length > 0) {
      query.courses = { $in: criteria.enrolledInCourses };
    }

    if (criteria.hasCompletedCourses) {
      query.CoursesTrophy = { $gt: 0 };
    }

    if (criteria.minCoursesCompleted) {
      query.CoursesTrophy = { $gte: criteria.minCoursesCompleted };
    }

    return query;
  }

  applyLocationFilter(query, criteria) {
    if (criteria.locations && criteria.locations.length > 0) {
      query.location = { $in: criteria.locations };
    }

    if (criteria.universities && criteria.universities.length > 0) {
      query.university = { $in: criteria.universities };
    }

    return query;
  }

  applyEngagementFilter(query, criteria) {
    if (criteria.minFriends) {
      query.$expr = { $gte: [{ $size: '$friends' }, criteria.minFriends] };
    }

    if (criteria.hasFriendRequests) {
      query['friendRequests.0'] = { $exists: true };
    }

    if (criteria.ratingRange) {
      query.rating = {};
      if (criteria.ratingRange.min !== undefined) {
        query.rating.$gte = criteria.ratingRange.min;
      }
      if (criteria.ratingRange.max !== undefined) {
        query.rating.$lte = criteria.ratingRange.max;
      }
    }

    return query;
  }

  applyDemographicsFilter(query, criteria) {
    if (criteria.ageRange) {
      query.age = {};
      if (criteria.ageRange.min !== undefined) {
        query.age.$gte = criteria.ageRange.min;
      }
      if (criteria.ageRange.max !== undefined) {
        query.age.$lte = criteria.ageRange.max;
      }
    }

    return query;
  }

  applyCustomFilter(query, criteria) {
    if (criteria.customQuery) {
      Object.assign(query, criteria.customQuery);
    }
    return query;
  }

  async filterUnsubscribedUsers(users) {
    try {
      const emails = users.map(user => user.email);
      const unsubscribedEmails = await Unsubscribe.find(
        { email: { $in: emails } },
        'email'
      );
      
      const unsubscribedSet = new Set(unsubscribedEmails.map(u => u.email));
      
      return users.filter(user => !unsubscribedSet.has(user.email));
    } catch (error) {
      console.error('Error filtering unsubscribed users:', error);
      return users; // Return original list if filtering fails
    }
  }

  async getSegmentStatistics(segments) {
    try {
      const baseQuery = this.buildBaseQuery();
      const totalUsers = await User.countDocuments(baseQuery);
      
      let query = baseQuery;
      for (const segment of segments) {
        query = this.applySegmentFilter(query, segment);
      }
      
      const segmentUsers = await User.countDocuments(query);
      
      return {
        totalUsers,
        segmentUsers,
        percentage: totalUsers > 0 ? (segmentUsers / totalUsers * 100).toFixed(2) : 0
      };
    } catch (error) {
      console.error('Error getting segment statistics:', error);
      throw error;
    }
  }

  async getAvailableSegmentOptions() {
    try {
      const [
        roles,
        skills,
        preferences,
        locations,
        universities,
        courses
      ] = await Promise.all([
        User.distinct('role'),
        User.distinct('skills'),
        User.distinct('preferences'),
        User.distinct('location'),
        User.distinct('university'),
        User.distinct('courses')
      ]);

      return {
        roles: roles.filter(Boolean),
        skills: skills.filter(Boolean),
        preferences: preferences.filter(Boolean),
        locations: locations.filter(Boolean),
        universities: universities.filter(Boolean),
        courses: courses.filter(Boolean)
      };
    } catch (error) {
      console.error('Error getting segment options:', error);
      throw error;
    }
  }

  async createDynamicSegment(name, filters) {
    try {
      const { users } = await this.getSegmentedUsers(filters);
      
      return {
        name,
        filters,
        userCount: users.length,
        userIds: users.map(user => user._id),
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error creating dynamic segment:', error);
      throw error;
    }
  }
}

module.exports = new SegmentationService();
