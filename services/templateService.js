const EmailTemplate = require('../models/EmailTemplate');
const TemplateServiceMonthly = require('./templateServiceMonthly');
const fs = require('fs').promises;
const path = require('path');

module.exports = class TemplateService {
  
  async createDefaultTemplates() {
    try {
      const templates = [
        {
          name: 'Welcome Email',
          description: 'Welcome email for new users',
          subject: 'Welcome to EduNode - Start Your Learning Journey!',
          category: 'welcome',
          htmlContent: await this.getDefaultWelcomeTemplate(),
          textContent: await this.getDefaultWelcomeTextTemplate(),
          variables: [
            { name: 'user.name', description: 'User\'s full name', type: 'string', required: true },
            { name: 'user.lastLogin', description: 'Last login date', type: 'string', required: false },
            { name: 'user.points', description: 'Current points', type: 'number', required: false }
          ]
        },
        {
          name: 'Weekly Digest',
          description: 'Weekly digest of platform activity and highlights',
          subject: 'Your Weekly EduNode Digest',
          category: 'newsletter',
          htmlContent: await this.getDefaultWeeklyDigestTemplate(),
          textContent: await this.getDefaultWeeklyDigestTextTemplate(),
          variables: [
            { name: 'user.name', description: 'User\'s full name', type: 'string', required: true },
            { name: 'user.lastLogin', description: 'Last login date', type: 'string', required: false },
            { name: 'user.points', description: 'Current points', type: 'number', required: false }
          ]
        },
        {
          name: 'Course Recommendations',
          description: 'Personalized course recommendations',
          subject: 'Recommended Courses for You on EduNode',
          category: 'course',
          htmlContent: await this.getDefaultCourseRecommendationsTemplate(),
          textContent: await this.getDefaultCourseRecommendationsTextTemplate(),
          variables: [
            { name: 'user.name', description: 'User\'s full name', type: 'string', required: true },
            { name: 'user.skills', description: 'User\'s skills array', type: 'array', required: false },
            { name: 'recommendedCourses', description: 'Array of recommended courses', type: 'array', required: false }
          ]
        },
        {
          name: 'Achievement Notification',
          description: 'Notification for user achievements',
          subject: 'Congratulations on Your Achievement!',
          category: 'achievement',
          htmlContent: await this.getDefaultAchievementTemplate(),
          textContent: await this.getDefaultAchievementTextTemplate(),
          variables: [
            { name: 'user.name', description: 'User\'s full name', type: 'string', required: true },
            { name: 'achievement.name', description: 'Achievement name', type: 'string', required: true },
            { name: 'achievement.description', description: 'Achievement description', type: 'string', required: false },
            { name: 'achievement.points', description: 'Points awarded', type: 'number', required: false }
          ]
        },
        {
          name: 'Re-engagement Campaign',
          description: 'Re-engagement email for inactive users',
          subject: 'We Miss You at EduNode!',
          category: 're-engagement',
          htmlContent: await this.getDefaultReEngagementTemplate(),
          textContent: await this.getDefaultReEngagementTextTemplate(),
          variables: [
            { name: 'user.name', description: 'User\'s full name', type: 'string', required: true },
            { name: 'user.lastLogin', description: 'Last login date', type: 'string', required: false },
            { name: 'user.points', description: 'Current points', type: 'number', required: false }
          ]
        },
        {
          name: 'Monthly Digest',
          description: 'Monthly summary of platform activity and highlights',
          subject: 'Your Monthly EduNode Digest',
          category: 'newsletter',
          htmlContent: await this.getDefaultMonthlyDigestTemplate(),
          textContent: await this.getDefaultMonthlyDigestTextTemplate(),
          variables: [
            { name: 'user.name', description: 'User\'s full name', type: 'string', required: true },
            { name: 'monthlyStats.coursesCompleted', description: 'Number of courses completed this month', type: 'number', required: false },
            { name: 'monthlyStats.newConnections', description: 'Number of new connections this month', type: 'number', required: false },
            { name: 'monthlyStats.pointsEarned', description: 'Points earned this month', type: 'number', required: false },
            { name: 'monthlyStats.topSkills', description: 'Top skills developed', type: 'array', required: false },
            { name: 'monthlyStats.upcomingEvents', description: 'Upcoming events and deadlines', type: 'array', required: false }
          ]
        }
      ];

      const createdTemplates = [];
      for (const templateData of templates) {
        const existingTemplate = await EmailTemplate.findOne({ name: templateData.name });
        if (!existingTemplate) {
          const template = new EmailTemplate({
            ...templateData,
            createdBy: '507f1f77bcf86cd799439011' // Default system user ObjectId
          });
          await template.save();
          createdTemplates.push(template);
        }
      }

      return createdTemplates;
    } catch (error) {
      console.error('Error creating default templates:', error);
      throw error;
    }
  }

  async getDefaultWelcomeTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to EduNode</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to EduNode!</h1>
    </div>
    <div class="content">
        <p>Hello {{user.name}},</p>
        <p>Welcome to EduNode! We're excited to have you join our learning community. Whether you're here to learn new skills, share your knowledge, or connect with other learners, you've come to the right place.</p>
        
        <h3>Get Started:</h3>
        <ul>
            <li>Complete your profile to get personalized recommendations</li>
            <li>Browse our course catalog</li>
            <li>Connect with other learners and educators</li>
            <li>Join challenges and earn achievements</li>
        </ul>
        
        <div style="text-align: center;">
            <a href="https://edunode.org/dashboard" class="button">Get Started Now</a>
        </div>
        
        <p>If you have any questions, feel free to reach out to our support team.</p>
        
        <p>Happy learning!</p>
        <p>The EduNode Team</p>
    </div>
    <div class="footer">
        <p>This email was sent to {{user.email}} because you registered on EduNode.</p>
        <p><a href="https://edunode.herokuapp.com/api/email/unsubscribe?email={{user.email}}">Unsubscribe</a></p>
    </div>
</body>
</html>`;
  }

  async getDefaultWelcomeTextTemplate() {
    return `Welcome to EduNode!

Hello {{user.name}},

Welcome to EduNode! We're excited to have you join our learning community. Whether you're here to learn new skills, share your knowledge, or connect with other learners, you've come to the right place.

Get Started:
- Complete your profile to get personalized recommendations
- Browse our course catalog
- Connect with other learners and educators
- Join challenges and earn achievements

Visit your dashboard: https://edunode.org/dashboard

If you have any questions, feel free to reach out to our support team.

Happy learning!
The EduNode Team

---
This email was sent to {{user.email}} because you registered on EduNode.
Unsubscribe: https://edunode.herokuapp.com/api/email/unsubscribe?email={{user.email}}`;
  }

  async getDefaultWeeklyDigestTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weekly Digest</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px 20px; background: #f9f9f9; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat { text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-number { font-size: 24px; font-weight: bold; color: #28a745; }
        .button { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Your Weekly EduNode Digest</h1>
    </div>
    <div class="content">
        <p>Hello {{user.name}},</p>
        <p>Here's your weekly summary of activity on EduNode!</p>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-number">{{weeklyStats.coursesCompleted || 0}}</div>
                <div>Courses Completed</div>
            </div>
            <div class="stat">
                <div class="stat-number">{{weeklyStats.newConnections || 0}}</div>
                <div>New Connections</div>
            </div>
            <div class="stat">
                <div class="stat-number">{{weeklyStats.pointsEarned || 0}}</div>
                <div>Points Earned</div>
            </div>
        </div>
        
        <h3>This Week's Highlights:</h3>
        <ul>
            <li>New courses added in {{user.skills}}</li>
            <li>Community challenges you might enjoy</li>
            <li>Trending topics in your areas of interest</li>
        </ul>
        
        <div style="text-align: center;">
            <a href="https://edunode.org/dashboard" class="button">View Your Dashboard</a>
        </div>
        
        <p>Keep up the great work!</p>
        <p>The EduNode Team</p>
    </div>
    <div class="footer">
        <p>This email was sent to {{user.email}} as part of your weekly digest.</p>
        <p><a href="https://edunode.herokuapp.com/api/email/unsubscribe?email={{user.email}}">Unsubscribe</a></p>
    </div>
</body>
</html>`;
  }

  async getDefaultWeeklyDigestTextTemplate() {
    return `Your Weekly EduNode Digest

Hello {{user.name}},

Here's your weekly summary of activity on EduNode!

Your Stats This Week:
- Courses Completed: {{weeklyStats.coursesCompleted || 0}}
- New Connections: {{weeklyStats.newConnections || 0}}
- Points Earned: {{weeklyStats.pointsEarned || 0}}

This Week's Highlights:
- New courses added in {{user.skills}}
- Community challenges you might enjoy
- Trending topics in your areas of interest

View your dashboard: https://edunode.org/dashboard

Keep up the great work!
The EduNode Team

---
This email was sent to {{user.email}} as part of your weekly digest.
Unsubscribe: https://edunode.herokuapp.com/api/email/unsubscribe?email={{user.email}}`;
  }

  async getDefaultCourseRecommendationsTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Course Recommendations</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #17a2b8; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px 20px; background: #f9f9f9; }
        .course { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .course-title { font-weight: bold; color: #17a2b8; margin-bottom: 5px; }
        .button { display: inline-block; padding: 12px 24px; background: #17a2b8; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Recommended Courses for You</h1>
    </div>
    <div class="content">
        <p>Hello {{user.name}},</p>
        <p>Based on your skills and interests, we've found some courses that might be perfect for you!</p>
        
        <div class="course">
            <div class="course-title">Introduction to Web Development</div>
            <p>Learn the fundamentals of HTML, CSS, and JavaScript to build modern websites.</p>
            <a href="https://edunode.org/courses/web-dev-intro" class="button">View Course</a>
        </div>
        
        <div class="course">
            <div class="course-title">Advanced JavaScript Techniques</div>
            <p>Take your JavaScript skills to the next level with advanced concepts and best practices.</p>
            <a href="https://edunode.org/courses/advanced-js" class="button">View Course</a>
        </div>
        
        <div class="course">
            <div class="course-title">Data Science Fundamentals</div>
            <p>Explore the world of data science with hands-on projects and real-world applications.</p>
            <a href="https://edunode.org/courses/data-science" class="button">View Course</a>
        </div>
        
        <div style="text-align: center;">
            <a href="https://edunode.org/courses" class="button">Browse All Courses</a>
        </div>
        
        <p>Happy learning!</p>
        <p>The EduNode Team</p>
    </div>
    <div class="footer">
        <p>This email was sent to {{user.email}} based on your profile and interests.</p>
        <p><a href="https://edunode.herokuapp.com/api/email/unsubscribe?email={{user.email}}">Unsubscribe</a></p>
    </div>
</body>
</html>`;
  }

  async getDefaultCourseRecommendationsTextTemplate() {
    return `Recommended Courses for You

Hello {{user.name}},

Based on your skills and interests, we've found some courses that might be perfect for you!

Featured Courses:
1. Introduction to Web Development
   Learn the fundamentals of HTML, CSS, and JavaScript to build modern websites.
   https://edunode.org/courses/web-dev-intro

2. Advanced JavaScript Techniques
   Take your JavaScript skills to the next level with advanced concepts and best practices.
   https://edunode.org/courses/advanced-js

3. Data Science Fundamentals
   Explore the world of data science with hands-on projects and real-world applications.
   https://edunode.org/courses/data-science

Browse all courses: https://edunode.org/courses

Happy learning!
The EduNode Team

---
This email was sent to {{user.email}} based on your profile and interests.
Unsubscribe: https://edunode.herokuapp.com/api/email/unsubscribe?email={{user.email}}`;
  }

  async getDefaultAchievementTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Achievement Unlocked!</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ffc107; color: #333; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px 20px; background: #f9f9f9; text-align: center; }
        .trophy { font-size: 48px; margin: 20px 0; }
        .achievement-title { font-size: 24px; font-weight: bold; color: #ffc107; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #ffc107; color: #333; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏆 Achievement Unlocked!</h1>
    </div>
    <div class="content">
        <div class="trophy">🏆</div>
        <h2>Congratulations, {{user.name}}!</h2>
        <div class="achievement-title">{{achievement.name}}</div>
        <p>{{achievement.description}}</p>
        <p><strong>Points Earned:</strong> {{achievement.points}}</p>
        
        <div style="text-align: center;">
            <a href="https://edunode.org/profile/achievements" class="button">View Your Achievements</a>
        </div>
        
        <p>Keep up the amazing work!</p>
        <p>The EduNode Team</p>
    </div>
    <div class="footer">
        <p>This email was sent to {{user.email}} to celebrate your achievement.</p>
        <p><a href="https://edunode.herokuapp.com/api/email/unsubscribe?email={{user.email}}">Unsubscribe</a></p>
    </div>
</body>
</html>`;
  }

  async getDefaultAchievementTextTemplate() {
    return `🏆 Achievement Unlocked!

Congratulations, {{user.name}}!

{{achievement.name}}
{{achievement.description}}

Points Earned: {{achievement.points}}

View your achievements: https://edunode.org/profile/achievements

Keep up the amazing work!
The EduNode Team

---
This email was sent to {{user.email}} to celebrate your achievement.
Unsubscribe: https://edunode.herokuapp.com/api/email/unsubscribe?email={{user.email}}`;
  }

  async getDefaultReEngagementTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>We Miss You!</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="header">
        <h1>We Miss You at EduNode!</h1>
    </div>
    <div class="content">
        <p>Hello {{user.name}},</p>
        <p>It's been a while since we've seen you on EduNode! We noticed you haven't logged in recently, and we wanted to check in.</p>
        
        <h3>What's New Since You've Been Gone:</h3>
        <ul>
            <li>New courses in {{user.skills}}</li>
            <li>Exciting community challenges</li>
            <li>Enhanced achievement system</li>
            <li>Improved course recommendations</li>
        </ul>
        
        <p>You currently have {{user.points}} points waiting for you!</p>
        
        <div style="text-align: center;">
            <a href="https://edunode.org/dashboard" class="button">Come Back and Learn</a>
        </div>
        
        <p>We'd love to see you back in the community!</p>
        <p>The EduNode Team</p>
    </div>
    <div class="footer">
        <p>This email was sent to {{user.email}} to welcome you back.</p>
        <p><a href="https://edunode.herokuapp.com/api/email/unsubscribe?email={{user.email}}">Unsubscribe</a></p>
    </div>
</body>
</html>`;
  }

  async getDefaultReEngagementTextTemplate() {
    return `We Miss You at EduNode!

Hello {{user.name}},

It's been a while since we've seen you on EduNode! We noticed you haven't logged in recently, and we wanted to check in.

What's New Since You've Been Gone:
- New courses in {{user.skills}}
- Exciting community challenges
- Enhanced achievement system
- Improved course recommendations

You currently have {{user.points}} points waiting for you!

Come back and continue your learning journey: https://edunode.org/dashboard

We'd love to see you back in the community!
The EduNode Team

---
This email was sent to {{user.email}} to welcome you back.
Unsubscribe: https://edunode.herokuapp.com/api/email/unsubscribe?email={{user.email}}`;
  }
}

module.exports = new TemplateService();
