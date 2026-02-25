/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://mummyj2treats.com',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  changefreq: 'daily',
  priority: 0.7,
  exclude: [],
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
    ],
  },
};
