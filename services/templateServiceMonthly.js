// Monthly digest template methods
class TemplateServiceMonthly {
  // Get default monthly digest template
  async getDefaultMonthlyDigestTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monthly EduNode Digest</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px 0; background: #f9f9f9; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat { text-align: center; padding: 15px; background: white; border-radius: 6px; min-width: 100px; }
        .stat-number { font-size: 24px; font-weight: bold; color: #28a745; margin-bottom: 5px; }
        .stat-label { font-size: 14px; color: #666; }
        .highlights { margin-top: 20px; }
        .highlight { background: white; padding: 15px; border-radius: 6px; margin-bottom: 10px; }
        .highlight-title { font-weight: bold; color: #28a745; margin-bottom: 10px; }
        .button { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Your Monthly EduNode Digest</h1>
        <p>Hello {{user.name}},</p>
    </div>
    
    <div class="content">
        <div class="stats">
            <div class="stat">
                <div class="stat-number">{{monthlyStats.coursesCompleted}}</div>
                <div class="stat-label">Courses Completed</div>
            </div>
            <div class="stat">
                <div class="stat-number">{{monthlyStats.newConnections}}</div>
                <div class="stat-label">New Connections</div>
            </div>
            <div class="stat">
                <div class="stat-number">{{monthlyStats.pointsEarned}}</div>
                <div class="stat-label">Points Earned</div>
            </div>
        </div>
        
        <div class="highlights">
            <div class="highlight">
                <div class="highlight-title">Top Skills This Month</div>
                <ul>
                    {{#each monthlyStats.topSkills}}
                    <li>{{this}}</li>
                    {{/each}}
                </ul>
            </div>
            
            <div class="highlight">
                <div class="highlight-title">Upcoming Events</div>
                <ul>
                    {{#each monthlyStats.upcomingEvents}}
                    <li>{{this.name}} - {{this.date}}</li>
                    {{/each}}
                </ul>
            </div>
        </div>
        
        <p>Keep up the great work! You're making excellent progress on EduNode.</p>
        <p style="text-align: center; margin-top: 30px;">
            <a href="https://edunode.org/dashboard" class="button">View Your Dashboard</a>
        </p>
    </div>
    
    <div style="padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee;">
        <p>This email was sent to {{user.email}} as part of your monthly digest.</p>
        <p><a href="https://edunode.org/api/email/unsubscribe?email={{user.email}}">Unsubscribe</a></p>
    </div>
</body>
</html>
    `;
  }

  // Get default monthly digest text template
  async getDefaultMonthlyDigestTextTemplate() {
    return `Your Monthly EduNode Digest

Hello {{user.name}},

Here's your monthly summary of activity on EduNode!

Your Stats This Month:
- Courses Completed: {{monthlyStats.coursesCompleted}}
- New Connections: {{monthlyStats.newConnections}}
- Points Earned: {{monthlyStats.pointsEarned}}

Top Skills Developed:
{{#each monthlyStats.topSkills}}
- {{this}}
{{/each}}

Upcoming Events:
{{#each monthlyStats.upcomingEvents}}
- {{this.name}} - {{this.date}}
{{/each}}

Keep up the great work! You're making excellent progress on EduNode.

View your dashboard: https://edunode.org/dashboard

---
This email was sent to {{user.email}} as part of your monthly digest.
Unsubscribe: https://edunode.org/api/email/unsubscribe?email={{user.email}}
  `;
  }
}

module.exports = TemplateServiceMonthly;
