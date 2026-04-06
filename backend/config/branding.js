'use strict';

module.exports = {
    company: {
        name: 'The Resilience Atlas\u2122',
        domain: process.env.COMPANY_DOMAIN || 'theresilienceatlas.com',
        email: process.env.COMPANY_EMAIL || 'janeen@theresilienceatlas.com',
        supportEmail: process.env.SUPPORT_EMAIL || 'janeen@theresilienceatlas.com',
        tagline: 'Your Personal Navigation Map to Lasting Resilience',
    },
    social: {
        linkedin: process.env.LINKEDIN_URL || 'https://www.linkedin.com/company/theresilienceatlas',
        twitter: process.env.TWITTER_URL || 'https://x.com/atlasresilience',
        facebook: process.env.FACEBOOK_URL || 'https://www.facebook.com/profile.php?id=100076220534241',
        youtube: process.env.YOUTUBE_URL || 'https://www.youtube.com/@janeenstalnaker8395',
    },
    copyright: `\u00a9 ${new Date().getFullYear()} The Resilience Atlas\u2122. All rights reserved.`,
};
