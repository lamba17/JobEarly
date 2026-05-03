import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

interface Job {
  id: number
  role: string
  company: string
  loc: string
  match: number
  desc: string
  tags: string[]
  salary: string
  period: string
  color: string
  domain: string
  linkedinSlug: string
  requirements: string[]
  type: string
  portals: ('linkedin' | 'indeed' | 'naukri')[]
  postedDaysAgo: number
}

const INDIA_JOBS: Job[] = [
  { id: 1,  role: 'Senior Product Manager',       company: 'Swiggy',          loc: 'Bangalore',  match: 96, type: 'Full-time',  color: '#FC8019', domain: 'swiggy.com',         linkedinSlug: 'swiggy',                       portals: ['linkedin','indeed','naukri'],  salary: '₹40–₹60 LPA', period: 'per year', postedDaysAgo: 3,  tags: ['Product Strategy','Growth','Data-Driven'],      desc: 'Lead product strategy for Swiggy\'s core ordering experience. Drive 0-to-1 features serving 90M+ users.', requirements: ['5+ years PM experience','SQL and data analysis','A/B testing expertise','Stakeholder management','Consumer internet background'] },
  { id: 2,  role: 'UX Design Lead',               company: 'Flipkart',         loc: 'Bangalore',  match: 91, type: 'Full-time',  color: '#2874F0', domain: 'flipkart.com',        linkedinSlug: 'flipkart',                     portals: ['linkedin','indeed','naukri'],  salary: '₹35–₹55 LPA', period: 'per year', postedDaysAgo: 7,  tags: ['Design Systems','Mobile','Figma'],               desc: 'Define the design language for Flipkart\'s next-gen mobile commerce. Lead a team of 8 designers.', requirements: ['7+ years UX experience','End-to-end portfolio','Design team leadership','Figma proficiency','Mobile-first mindset'] },
  { id: 3,  role: 'Product Designer',             company: 'Zomato',           loc: 'Gurugram',   match: 88, type: 'Full-time',  color: '#E23744', domain: 'zomato.com',          linkedinSlug: 'zomato',                       portals: ['linkedin','indeed','naukri'],  salary: '₹25–₹40 LPA', period: 'per year', postedDaysAgo: 1,  tags: ['User Research','Figma','A/B Testing'],           desc: 'Shape the food discovery experience used by 20M+ daily active users across India and the Middle East.', requirements: ['3+ years product design','Consumer app portfolio','User research skills','Figma proficiency','Data-informed approach'] },
  { id: 4,  role: 'Senior Consultant',            company: 'Infosys',          loc: 'Pune',       match: 85, type: 'Full-time',  color: '#007CC3', domain: 'infosys.com',         linkedinSlug: 'infosys',                      portals: ['linkedin','indeed','naukri'],  salary: '₹20–₹35 LPA', period: 'per year', postedDaysAgo: 14, tags: ['Consulting','Digital Transformation','Agile'],  desc: 'Drive digital transformation for Fortune 500 clients. Lead cross-functional teams and manage stakeholders.', requirements: ['4+ years consulting','Digital transformation track record','Client-facing communication','Agile/Scrum certified','MBA preferred'] },
  { id: 5,  role: 'Data Scientist',               company: 'Meesho',           loc: 'Bangalore',  match: 82, type: 'Full-time',  color: '#570DF8', domain: 'meesho.com',          linkedinSlug: 'meesho',                       portals: ['linkedin','indeed','naukri'],  salary: '₹30–₹50 LPA', period: 'per year', postedDaysAgo: 2,  tags: ['Python','ML','Recommendation Systems'],         desc: 'Build ML models for personalised recommendations and demand forecasting for India\'s fastest-growing social commerce.', requirements: ['3+ years data science','Python/SQL/statistics','Recommendation systems','PyTorch or TensorFlow','Large-scale pipelines'] },
  { id: 6,  role: 'Engineering Manager',          company: 'CRED',             loc: 'Bangalore',  match: 79, type: 'Full-time',  color: '#1C1C1C', domain: 'cred.club',           linkedinSlug: 'cred-club',                    portals: ['linkedin','indeed','naukri'],  salary: '₹50–₹80 LPA', period: 'per year', postedDaysAgo: 5,  tags: ['Leadership','Backend','FinTech'],                desc: 'Lead a team of 10 engineers on CRED\'s credit management and rewards platform serving premium credit card users.', requirements: ['5+ years engineering','2+ years leadership','High-scale backend systems','Hiring and mentoring track record','Fintech a plus'] },
  { id: 7,  role: 'Business Analyst',             company: 'TCS',              loc: 'Mumbai',     match: 77, type: 'Full-time',  color: '#00A0D2', domain: 'tcs.com',             linkedinSlug: 'tata-consultancy-services',    portals: ['linkedin','indeed','naukri'],  salary: '₹12–₹22 LPA', period: 'per year', postedDaysAgo: 21, tags: ['SQL','JIRA','Stakeholder Management'],           desc: 'Translate business requirements into technical specs for large-scale enterprise transformation across BFSI.', requirements: ['2+ years as BA','BFSI domain experience','SQL proficiency','Requirements documentation','JIRA/Confluence skills'] },
  { id: 8,  role: 'Growth Product Manager',       company: 'PhonePe',          loc: 'Bangalore',  match: 84, type: 'Full-time',  color: '#5F259F', domain: 'phonepe.com',         linkedinSlug: 'phonepe',                      portals: ['linkedin','indeed','naukri'],  salary: '₹35–₹55 LPA', period: 'per year', postedDaysAgo: 1,  tags: ['Growth','Analytics','FinTech'],                  desc: 'Own the growth funnel for PhonePe\'s insurance and mutual funds vertical. Drive acquisition, activation, and retention.', requirements: ['4+ years PM experience','Growth/PLG track record','SQL/Python skills','Fintech experience','Data-driven decisions'] },
  { id: 9,  role: 'Backend Engineer',             company: 'Razorpay',         loc: 'Bangalore',  match: 81, type: 'Full-time',  color: '#2EB5C9', domain: 'razorpay.com',        linkedinSlug: 'razorpay',                     portals: ['linkedin','indeed','naukri'],  salary: '₹28–₹45 LPA', period: 'per year', postedDaysAgo: 4,  tags: ['Java','Microservices','Payments'],               desc: 'Build and scale high-throughput payment processing systems serving 8M+ Indian businesses.', requirements: ['3+ years backend engineering','Java or Go expertise','Microservices architecture','Payments domain understanding','High-availability systems'] },
  { id: 10, role: 'Product Manager',              company: 'Ola',              loc: 'Bangalore',  match: 80, type: 'Full-time',  color: '#F5A623', domain: 'olacabs.com',         linkedinSlug: 'ani-technologies',             portals: ['linkedin','indeed','naukri'],  salary: '₹22–₹38 LPA', period: 'per year', postedDaysAgo: 10, tags: ['Mobility','Product Strategy','Operations'],     desc: 'Drive product for Ola\'s driver-partner and consumer experience across India\'s largest mobility platform.', requirements: ['3+ years PM experience','Marketplace or mobility background','Data analysis skills','Cross-functional collaboration','Structured problem solving'] },
  { id: 11, role: 'ML Engineer',                  company: 'Google India',     loc: 'Hyderabad',  match: 89, type: 'Full-time',  color: '#4285F4', domain: 'google.com',          linkedinSlug: 'google',                       portals: ['linkedin','indeed'],           salary: '₹60–₹120 LPA',period: 'per year', postedDaysAgo: 0,  tags: ['TensorFlow','Python','Large-Scale ML'],         desc: 'Build and deploy large-scale machine learning models powering Google Search, Maps, and Assistant in India.', requirements: ['4+ years ML engineering','TensorFlow/JAX expertise','ML system design','Research background preferred','Publications a plus'] },
  { id: 12, role: 'Software Development Engineer',company: 'Amazon India',     loc: 'Bangalore',  match: 86, type: 'Full-time',  color: '#FF9900', domain: 'amazon.in',           linkedinSlug: 'amazon',                       portals: ['linkedin','indeed'],           salary: '₹45–₹90 LPA', period: 'per year', postedDaysAgo: 2,  tags: ['Java','Distributed Systems','AWS'],             desc: 'Design and build highly scalable systems that power Amazon\'s India marketplace serving 300M+ customers.', requirements: ['3+ years SDE experience','Java or Python expertise','System design proficiency','AWS knowledge','OOP and data structures'] },
  { id: 13, role: 'Finance Analyst',              company: 'Paytm',            loc: 'Noida',      match: 74, type: 'Full-time',  color: '#00BAF2', domain: 'paytm.com',           linkedinSlug: 'one97-communications-paytm',   portals: ['linkedin','indeed','naukri'],  salary: '₹10–₹18 LPA', period: 'per year', postedDaysAgo: 15, tags: ['Excel','Financial Modelling','Reporting'],     desc: 'Prepare financial reports, budgets, and forecasts for Paytm\'s financial services business units.', requirements: ['2+ years finance experience','Financial modelling skills','Advanced Excel/SQL','Fintech understanding','CA/MBA Finance preferred'] },
  { id: 14, role: 'Full Stack Developer',         company: 'Groww',            loc: 'Bangalore',  match: 83, type: 'Full-time',  color: '#5367FF', domain: 'groww.in',            linkedinSlug: 'groww',                        portals: ['linkedin','indeed','naukri'],  salary: '₹25–₹45 LPA', period: 'per year', postedDaysAgo: 6,  tags: ['React','Node.js','TypeScript'],                 desc: 'Build the next generation of wealth management features for Groww\'s 15M+ active investors.', requirements: ['3+ years full-stack experience','React and Node.js proficiency','TypeScript expertise','REST API design','Fintech or consumer product background'] },
  { id: 15, role: 'DevOps Engineer',              company: 'Wipro',            loc: 'Hyderabad',  match: 72, type: 'Full-time',  color: '#341C6A', domain: 'wipro.com',           linkedinSlug: 'wipro',                        portals: ['linkedin','indeed','naukri'],  salary: '₹12–₹22 LPA', period: 'per year', postedDaysAgo: 28, tags: ['Kubernetes','CI/CD','Terraform'],                desc: 'Design and maintain CI/CD pipelines and cloud infrastructure for large enterprise clients across banking and retail.', requirements: ['3+ years DevOps experience','Kubernetes and Docker expertise','Terraform/IaC proficiency','CI/CD pipeline experience','AWS or Azure certified'] },
  { id: 16, role: 'Data Engineer',                company: 'Myntra',           loc: 'Bangalore',  match: 80, type: 'Full-time',  color: '#FF3F6C', domain: 'myntra.com',          linkedinSlug: 'myntra',                       portals: ['linkedin','indeed','naukri'],  salary: '₹22–₹40 LPA', period: 'per year', postedDaysAgo: 3,  tags: ['Spark','Airflow','BigQuery'],                   desc: 'Build and maintain Myntra\'s data platform powering personalisation, inventory forecasting, and analytics.', requirements: ['3+ years data engineering','Spark and Airflow expertise','SQL and Python proficiency','Data warehouse design','E-commerce data background a plus'] },
  { id: 17, role: 'Product Manager',              company: 'Nykaa',            loc: 'Mumbai',     match: 78, type: 'Full-time',  color: '#FC2779', domain: 'nykaa.com',           linkedinSlug: 'nykaa',                        portals: ['linkedin','indeed','naukri'],  salary: '₹20–₹35 LPA', period: 'per year', postedDaysAgo: 12, tags: ['E-commerce','Product Strategy','Analytics'],   desc: 'Own the product roadmap for Nykaa\'s beauty and fashion vertical serving 30M+ customers.', requirements: ['3+ years PM experience','E-commerce background preferred','Data-driven product decisions','Stakeholder alignment','Customer empathy'] },
  { id: 18, role: 'Operations Manager',           company: 'Urban Company',    loc: 'Gurugram',   match: 75, type: 'Full-time',  color: '#5e4ce6', domain: 'urbancompany.com',    linkedinSlug: 'urban-company',                portals: ['linkedin','indeed','naukri'],  salary: '₹15–₹28 LPA', period: 'per year', postedDaysAgo: 8,  tags: ['Operations','Process Improvement','Leadership'],desc: 'Lead city operations for Urban Company\'s home services platform, managing quality, supply, and demand.', requirements: ['3+ years operations management','Process improvement experience','Data analysis skills','Team leadership','Operations or consulting background'] },
  { id: 19, role: 'Frontend Engineer',            company: 'Zepto',            loc: 'Mumbai',     match: 76, type: 'Full-time',  color: '#A020F0', domain: 'zeptonow.com',        linkedinSlug: 'zepto-app',                    portals: ['linkedin','naukri'],          salary: '₹20–₹38 LPA', period: 'per year', postedDaysAgo: 1,  tags: ['React','Performance','TypeScript'],             desc: 'Build the sub-10-minute grocery delivery experience for Zepto\'s rapidly growing consumer app.', requirements: ['2+ years frontend experience','React and TypeScript expertise','Performance optimization skills','Consumer app experience','Mobile web proficiency'] },
  { id: 20, role: 'Product Marketing Manager',    company: 'MakeMyTrip',       loc: 'Gurugram',   match: 73, type: 'Full-time',  color: '#E40045', domain: 'makemytrip.com',      linkedinSlug: 'makemytrip',                   portals: ['linkedin','indeed','naukri'],  salary: '₹18–₹32 LPA', period: 'per year', postedDaysAgo: 20, tags: ['GTM','Marketing Analytics','Brand'],            desc: 'Drive go-to-market strategy and campaigns for MakeMyTrip\'s hotel and holiday packages vertical.', requirements: ['3+ years product marketing','B2C campaign management','Marketing analytics proficiency','Travel industry a plus','Brand storytelling skills'] },
  { id: 21, role: 'Senior Software Engineer',     company: 'Atlassian',        loc: 'Bangalore',  match: 88, type: 'Full-time',  color: '#0052CC', domain: 'atlassian.com',       linkedinSlug: 'atlassian',                    portals: ['linkedin','indeed'],          salary: '₹50–₹95 LPA', period: 'per year', postedDaysAgo: 0,  tags: ['Java','Distributed Systems','Cloud'],           desc: 'Build developer tools used by millions of teams worldwide at Atlassian\'s India engineering hub.', requirements: ['5+ years software engineering','Java or Python expertise','Distributed systems knowledge','Collaborative remote work style','OSS contributions a plus'] },
  { id: 22, role: 'Product Manager – Ads',        company: 'ShareChat',        loc: 'Bangalore',  match: 79, type: 'Full-time',  color: '#0FAAD0', domain: 'sharechat.com',       linkedinSlug: 'sharechat',                    portals: ['linkedin','indeed','naukri'],  salary: '₹30–₹50 LPA', period: 'per year', postedDaysAgo: 9,  tags: ['Ads Tech','Monetisation','Analytics'],          desc: 'Own ShareChat\'s ads monetisation product across vernacular social media reaching 400M+ Indian users.', requirements: ['3+ years PM experience','Ads or monetisation background','Data-driven mindset','Understanding of Indian internet users','SQL proficiency'] },
  { id: 23, role: 'Consultant – Strategy',        company: 'Deloitte India',   loc: 'Mumbai',     match: 83, type: 'Full-time',  color: '#86BC25', domain: 'deloitte.com',        linkedinSlug: 'deloitte',                     portals: ['linkedin','indeed','naukri'],  salary: '₹18–₹32 LPA', period: 'per year', postedDaysAgo: 5,  tags: ['Strategy','Business Consulting','BFSI'],        desc: 'Deliver strategy and operations consulting for leading BFSI and technology clients across India and SEA.', requirements: ['2+ years consulting experience','MBA or equivalent','Structured problem solving','Excellent presentation skills','BFSI domain a plus'] },
  { id: 24, role: 'Machine Learning Engineer',    company: 'Freshworks',       loc: 'Chennai',    match: 81, type: 'Full-time',  color: '#f5871f', domain: 'freshworks.com',      linkedinSlug: 'freshworks',                   portals: ['linkedin','indeed','naukri'],  salary: '₹28–₹50 LPA', period: 'per year', postedDaysAgo: 16, tags: ['NLP','Python','SaaS'],                          desc: 'Build AI-powered features for Freshworks\' CRM and support products used by 60,000+ businesses globally.', requirements: ['3+ years ML engineering','NLP and LLM experience','Python expertise','SaaS product understanding','API design skills'] },

  // ── Remote jobs ────────────────────────────────────────────────────────────
  { id: 25, role: 'Senior Frontend Engineer',      company: 'GitLab',           loc: 'Remote',     match: 92, type: 'Remote',      color: '#FC6D26', domain: 'gitlab.com',          linkedinSlug: 'gitlab-com',                   portals: ['linkedin','indeed'],          salary: '₹60–₹100 LPA',period: 'per year', postedDaysAgo: 0,  tags: ['Vue.js','TypeScript','Open Source'],            desc: 'Build GitLab\'s web interface used by 30M+ developers. Fully remote, async-first culture with engineers across 65+ countries.', requirements: ['5+ years frontend engineering','Vue.js or React expertise','TypeScript proficiency','Open source contributions a plus','Strong async communication'] },
  { id: 26, role: 'Staff Software Engineer',       company: 'Automattic',       loc: 'Remote',     match: 89, type: 'Remote',      color: '#0675C4', domain: 'automattic.com',      linkedinSlug: 'automattic',                   portals: ['linkedin','indeed'],          salary: '₹55–₹90 LPA', period: 'per year', postedDaysAgo: 3,  tags: ['PHP','React','Distributed Teams'],              desc: 'Work on WordPress.com, WooCommerce, or Jetpack — powering 43% of the web. 100% distributed team, fully async.', requirements: ['6+ years engineering','PHP or JavaScript expertise','Remote work experience','Strong written communication','Open source background preferred'] },
  { id: 27, role: 'Product Manager',               company: 'Postman',          loc: 'Remote',     match: 87, type: 'Remote',      color: '#FF6C37', domain: 'postman.com',         linkedinSlug: 'postman',                      portals: ['linkedin','indeed','naukri'],  salary: '₹40–₹70 LPA', period: 'per year', postedDaysAgo: 1,  tags: ['API Platform','Developer Tools','PLG'],         desc: 'Drive product for Postman\'s API collaboration platform used by 25M+ developers worldwide. India-friendly remote role.', requirements: ['4+ years PM experience','Developer tools or API background','PLG expertise','Data-driven decisions','Excellent writing skills'] },
  { id: 28, role: 'Senior QA Engineer',            company: 'BrowserStack',     loc: 'Remote',     match: 84, type: 'Remote',      color: '#FF6600', domain: 'browserstack.com',    linkedinSlug: 'browserstack',                 portals: ['linkedin','indeed','naukri'],  salary: '₹25–₹45 LPA', period: 'per year', postedDaysAgo: 7,  tags: ['Selenium','Appium','Test Automation'],          desc: 'Shape quality for BrowserStack\'s cloud-based browser testing platform used by Netflix, Twitter, and 50,000+ customers.', requirements: ['4+ years QA automation','Selenium and Appium expertise','JavaScript or Python','CI/CD integration','API testing skills'] },
  { id: 29, role: 'Backend Engineer – GraphQL',    company: 'Hasura',           loc: 'Remote',     match: 88, type: 'Remote',      color: '#1EB4D4', domain: 'hasura.io',           linkedinSlug: 'hasura',                       portals: ['linkedin','indeed'],          salary: '₹40–₹75 LPA', period: 'per year', postedDaysAgo: 2,  tags: ['GraphQL','Haskell','PostgreSQL'],               desc: 'Build the core GraphQL engine at Hasura — a remote-first company whose open-source product powers 100,000+ apps.', requirements: ['4+ years backend engineering','GraphQL expertise','PostgreSQL deep knowledge','Haskell or functional programming a plus','Open source contributions'] },
  { id: 30, role: 'Revenue Operations Analyst',    company: 'Chargebee',        loc: 'Remote',     match: 80, type: 'Remote',      color: '#E65100', domain: 'chargebee.com',       linkedinSlug: 'chargebee',                    portals: ['linkedin','indeed','naukri'],  salary: '₹18–₹32 LPA', period: 'per year', postedDaysAgo: 14, tags: ['Salesforce','Revenue Analytics','SaaS Metrics'], desc: 'Support Chargebee\'s global revenue engine — owned by data, powered by subscriptions. Remote-first SaaS company.', requirements: ['2+ years RevOps or analytics','Salesforce or HubSpot experience','Advanced SQL','SaaS metrics fluency','Subscription billing knowledge'] },
  { id: 31, role: 'UX/UI Designer',               company: 'InVideo',          loc: 'Remote',     match: 83, type: 'Remote',      color: '#7C3AED', domain: 'invideo.io',          linkedinSlug: 'invideo-ai',                   portals: ['linkedin','indeed','naukri'],  salary: '₹20–₹38 LPA', period: 'per year', postedDaysAgo: 4,  tags: ['Figma','Motion Design','SaaS'],                 desc: 'Design delightful experiences for InVideo\'s AI-powered video editor used by 7M+ creators in 190 countries.', requirements: ['3+ years UI/UX design','Figma and Principle proficiency','Motion/animation design skills','Consumer SaaS portfolio','Async collaboration experience'] },
  { id: 32, role: 'Data Analyst',                 company: 'Wingify (VWO)',    loc: 'Remote',     match: 79, type: 'Remote',      color: '#00B4CC', domain: 'vwo.com',             linkedinSlug: 'wingify',                      portals: ['linkedin','indeed','naukri'],  salary: '₹15–₹28 LPA', period: 'per year', postedDaysAgo: 11, tags: ['SQL','A/B Testing','Analytics'],                desc: 'Drive data insights for VWO\'s A/B testing platform used by 3,000+ businesses. Remote-first with no micromanagement.', requirements: ['2+ years data analysis','SQL and Python proficiency','A/B testing understanding','Analytics tool experience','Strong visualisation skills'] },
  { id: 33, role: 'Customer Success Manager',      company: 'Zoho',             loc: 'Remote',     match: 77, type: 'Remote',      color: '#E42527', domain: 'zoho.com',            linkedinSlug: 'zoho',                         portals: ['linkedin','indeed','naukri'],  salary: '₹12–₹22 LPA', period: 'per year', postedDaysAgo: 6,  tags: ['CRM','Customer Success','SaaS'],                desc: 'Own the success journey for Zoho\'s enterprise customers across APAC. Fully remote, flexible hours, India-based team.', requirements: ['2+ years customer success','CRM software knowledge','B2B SaaS experience','Excellent communication','Renewals and upsell experience'] },
  { id: 34, role: 'Full Stack Engineer',           company: 'Springworks',      loc: 'Remote',     match: 82, type: 'Remote',      color: '#6C63FF', domain: 'springworks.in',      linkedinSlug: 'springworks-in',               portals: ['linkedin','indeed','naukri'],  salary: '₹18–₹35 LPA', period: 'per year', postedDaysAgo: 1,  tags: ['React','Node.js','HR Tech'],                    desc: 'Build remote-first HR tech products at Springworks — one of India\'s fastest-growing distributed teams.', requirements: ['3+ years full-stack','React and Node.js proficiency','TypeScript experience','API design skills','Remote work track record'] },
  { id: 35, role: 'Senior Content Strategist',     company: 'upGrad',           loc: 'Remote',     match: 75, type: 'Remote',      color: '#FB7903', domain: 'upgrad.com',          linkedinSlug: 'upgrad-edtech',                portals: ['linkedin','indeed','naukri'],  salary: '₹14–₹26 LPA', period: 'per year', postedDaysAgo: 22, tags: ['Content Strategy','EdTech','SEO'],              desc: 'Shape the content strategy for India\'s largest online higher-education platform reaching 3M+ learners.', requirements: ['4+ years content strategy','EdTech or B2B content background','SEO proficiency','Strong editorial judgement','Data-driven content planning'] },
  { id: 36, role: 'DevOps / SRE',                 company: 'Dukaan',           loc: 'Remote',     match: 81, type: 'Remote',      color: '#4CAF50', domain: 'mydukaan.io',         linkedinSlug: 'dukaan',                       portals: ['linkedin','indeed','naukri'],  salary: '₹22–₹42 LPA', period: 'per year', postedDaysAgo: 8,  tags: ['Kubernetes','GCP','CI/CD'],                     desc: 'Keep Dukaan\'s e-commerce infrastructure resilient for 10M+ small businesses. Fully remote with an async culture.', requirements: ['3+ years DevOps/SRE','Kubernetes and Docker expertise','GCP or AWS experience','Terraform/IaC proficiency','On-call experience'] },
  { id: 37, role: 'Product Designer',              company: 'Razorpay',         loc: 'Remote',     match: 85, type: 'Remote',      color: '#2EB5C9', domain: 'razorpay.com',        linkedinSlug: 'razorpay',                     portals: ['linkedin','indeed','naukri'],  salary: '₹25–₹45 LPA', period: 'per year', postedDaysAgo: 0,  tags: ['Figma','FinTech','Design Systems'],              desc: 'Design seamless payment experiences at Razorpay. This is a remote-first opening across their product design team.', requirements: ['3+ years product design','Figma expertise','FinTech or payments portfolio','User research skills','System thinking'] },
  { id: 38, role: 'Growth Marketer',               company: 'CleverTap',        loc: 'Remote',     match: 78, type: 'Remote',      color: '#E74C3C', domain: 'clevertap.com',       linkedinSlug: 'clevertap',                    portals: ['linkedin','indeed','naukri'],  salary: '₹16–₹30 LPA', period: 'per year', postedDaysAgo: 5,  tags: ['Performance Marketing','SaaS','Analytics'],    desc: 'Drive demand generation for CleverTap\'s customer engagement platform used by 10,000+ apps. Fully remote role.', requirements: ['3+ years growth or performance marketing','B2B SaaS marketing experience','Google/Meta ads proficiency','Marketing analytics skills','Content and campaign management'] },
]

const GLOBAL_JOBS: Job[] = [
  { id: 1, role: 'Senior Product Architect',    company: 'Stellar Systems',  loc: 'Remote',         match: 98, type: 'Remote · Full-time', color: '#1e293b', domain: 'stellar.io',      linkedinSlug: 'stellar-development-foundation', portals: ['linkedin','indeed'], salary: '$180k–$220k', period: 'USD/yr', postedDaysAgo: 5,  tags: ['Distributed Systems','Kubernetes','Leadership'], desc: 'Lead core architecture of next-gen cloud infrastructure at a fast-growing systems company.', requirements: ['8+ years software architecture','Distributed systems expertise','Platform/infra team leadership','Kubernetes proficiency','Async communication skills'] },
  { id: 2, role: 'Lead UX Strategist',          company: 'Nexus Finance',    loc: 'New York, NY',   match: 89, type: 'Full-time',           color: '#0f172a', domain: 'nexus.io',        linkedinSlug: 'nexus-mutual',                   portals: ['linkedin','indeed'], salary: '$165k–$190k', period: 'USD/yr', postedDaysAgo: 18, tags: ['Design Systems','FinTech','Research'],           desc: 'Define the editorial design system for a global FinTech expansion targeting enterprise customers.', requirements: ['7+ years UX leadership','Global design systems experience','Fintech background','Engineering collaboration','Measurable design impact'] },
  { id: 3, role: 'Principal Product Designer',  company: 'Vercel',           loc: 'Remote',         match: 94, type: 'Remote · Full-time', color: '#000000', domain: 'vercel.com',       linkedinSlug: 'vercel',                         portals: ['linkedin','indeed'], salary: '$170k–$200k', period: 'USD/yr', postedDaysAgo: 2,  tags: ['Developer Tools','Figma','DX'],                  desc: 'Shape the future of developer experience. Lead design for core platform features used by millions.', requirements: ['6+ years product design','Developer tools passion','Deep Figma expertise','Complex SaaS features','Async communication'] },
  { id: 4, role: 'Design System Lead',          company: 'Stripe',           loc: 'San Francisco',  match: 91, type: 'Full-time',           color: '#635bff', domain: 'stripe.com',       linkedinSlug: 'stripe',                         portals: ['linkedin','indeed'], salary: '$190k–$230k', period: 'USD/yr', postedDaysAgo: 11, tags: ['Design Systems','React','Accessibility'],        desc: 'Build and scale the design foundation for Stripe\'s global product suite.', requirements: ['7+ years design/frontend','Design system expertise','React and a11y skills','Cross-functional leadership','Quality obsession'] },
  { id: 5, role: 'Senior Product Manager',      company: 'Notion',           loc: 'Remote',         match: 87, type: 'Remote · Full-time', color: '#000000', domain: 'notion.so',        linkedinSlug: 'notionhq',                       portals: ['linkedin','indeed'], salary: '$160k–$195k', period: 'USD/yr', postedDaysAgo: 1,  tags: ['Productivity','PLG','B2B SaaS'],                 desc: 'Drive product strategy for Notion\'s collaborative workspace tools used by 30M+ users globally.', requirements: ['5+ years PM experience','PLG expertise','B2B SaaS background','Strong writing skills','Async-first work style'] },
  { id: 6, role: 'Product Manager',             company: 'Figma',            loc: 'San Francisco',  match: 90, type: 'Full-time',           color: '#F24E1E', domain: 'figma.com',        linkedinSlug: 'figma',                          portals: ['linkedin','indeed'], salary: '$175k–$210k', period: 'USD/yr', postedDaysAgo: 7,  tags: ['Design Tools','Platform','Developer API'],       desc: 'Lead product for Figma\'s developer-facing platform and plugin ecosystem used by 8M+ designers.', requirements: ['4+ years PM experience','Design tool or dev tool background','API product experience','Strong cross-functional collaboration','Data-driven approach'] },
]

const USA_JOBS: Job[] = [
  { id: 101, role: 'Product Manager',             company: 'OpenAI',       loc: 'San Francisco, CA', match: 95, type: 'Full-time',         color: '#10A37F', domain: 'openai.com',       linkedinSlug: 'openai',          portals: ['linkedin','indeed'], salary: '$180k–$230k', period: 'USD/yr', postedDaysAgo: 0,  tags: ['LLM Products','Product Strategy','AI/ML'],       desc: 'Define and ship the next generation of AI-powered products at OpenAI. Work directly with researchers to bring frontier models to millions of users.', requirements: ['5+ years PM experience','AI/ML product background','Strong technical intuition','Exceptional writing and communication','Experience shipping consumer or enterprise AI tools'] },
  { id: 102, role: 'Software Engineer',            company: 'Anthropic',    loc: 'San Francisco, CA', match: 92, type: 'Full-time',         color: '#C87533', domain: 'anthropic.com',     linkedinSlug: 'anthropic',       portals: ['linkedin','indeed'], salary: '$190k–$250k', period: 'USD/yr', postedDaysAgo: 1,  tags: ['Python','LLM Safety','Distributed Systems'],      desc: 'Build infrastructure and tooling that enables Anthropic to develop safe and capable AI systems at scale.', requirements: ['4+ years software engineering','Python and distributed systems expertise','Interest in AI safety','Systems design proficiency','Strong debugging skills'] },
  { id: 103, role: 'Senior Product Manager',       company: 'Google',       loc: 'Mountain View, CA', match: 91, type: 'Full-time',         color: '#4285F4', domain: 'google.com',        linkedinSlug: 'google',          portals: ['linkedin','indeed'], salary: '$200k–$270k', period: 'USD/yr', postedDaysAgo: 2,  tags: ['Search','Consumer Product','Data-Driven'],        desc: "Lead product strategy for Google's core Search products touching 8 billion+ queries daily.", requirements: ['6+ years PM experience','Search or consumer product background','Data-driven decision making','Cross-functional leadership','MBA or equivalent preferred'] },
  { id: 104, role: 'Product Designer',             company: 'Meta',         loc: 'Menlo Park, CA',    match: 88, type: 'Full-time',         color: '#0866FF', domain: 'meta.com',          linkedinSlug: 'meta',            portals: ['linkedin','indeed'], salary: '$165k–$215k', period: 'USD/yr', postedDaysAgo: 3,  tags: ['Social Products','Design Systems','Mobile'],      desc: 'Shape the future of social connection through thoughtful product design across Meta\'s family of apps serving 3B+ users.', requirements: ['5+ years product design','Social or consumer app portfolio','Design systems experience','Figma proficiency','Collaboration with engineering at scale'] },
  { id: 105, role: 'Software Dev Engineer II',     company: 'Amazon',       loc: 'Seattle, WA',       match: 87, type: 'Full-time',         color: '#FF9900', domain: 'amazon.com',        linkedinSlug: 'amazon',          portals: ['linkedin','indeed'], salary: '$155k–$210k', period: 'USD/yr', postedDaysAgo: 1,  tags: ['Java','AWS','Distributed Systems'],               desc: 'Build highly available distributed systems that power Amazon\'s retail, logistics, and cloud businesses.', requirements: ['3+ years SDE experience','Java or Go expertise','AWS knowledge','System design at scale','Strong CS fundamentals'] },
  { id: 106, role: 'Senior Software Engineer',     company: 'Microsoft',    loc: 'Redmond, WA',       match: 86, type: 'Full-time',         color: '#0078D4', domain: 'microsoft.com',     linkedinSlug: 'microsoft',       portals: ['linkedin','indeed'], salary: '$155k–$210k', period: 'USD/yr', postedDaysAgo: 5,  tags: ['Azure','C#','Cloud Infrastructure'],              desc: 'Design and build cloud infrastructure powering Azure — the backbone for millions of enterprise customers worldwide.', requirements: ['4+ years engineering','C# or Go expertise','Azure platform knowledge','Distributed systems','Collaborative engineering culture'] },
  { id: 107, role: 'Product Manager',              company: 'Apple',        loc: 'Cupertino, CA',     match: 89, type: 'Full-time',         color: '#555555', domain: 'apple.com',         linkedinSlug: 'apple',           portals: ['linkedin','indeed'], salary: '$175k–$230k', period: 'USD/yr', postedDaysAgo: 4,  tags: ['Hardware Software','Consumer Devices','Privacy'], desc: 'Drive product vision for Apple\'s ecosystem integrating hardware and software for iPhone, iPad, and Mac.', requirements: ['5+ years PM experience','Hardware/software integration background','Extreme attention to detail','Cross-functional collaboration','Consumer product obsession'] },
  { id: 108, role: 'Senior Software Engineer',     company: 'Netflix',      loc: 'Remote',            match: 93, type: 'Remote · Full-time', color: '#E50914', domain: 'netflix.com',       linkedinSlug: 'netflix',         portals: ['linkedin','indeed'], salary: '$220k–$310k', period: 'USD/yr', postedDaysAgo: 0,  tags: ['Java','Streaming','Microservices'],               desc: 'Build the streaming infrastructure serving 280M+ subscribers globally at Netflix — one of the highest-paying engineering teams in the world.', requirements: ['5+ years engineering','Java or Python expertise','Streaming or high-scale systems','Microservices architecture','Exceptional communication'] },
  { id: 109, role: 'Engineering Manager',          company: 'Stripe',       loc: 'San Francisco, CA', match: 90, type: 'Full-time',         color: '#635BFF', domain: 'stripe.com',        linkedinSlug: 'stripe',          portals: ['linkedin','indeed'], salary: '$200k–$260k', period: 'USD/yr', postedDaysAgo: 2,  tags: ['Payments','Leadership','Distributed Systems'],    desc: 'Lead a team of senior engineers building the global payments infrastructure that powers millions of businesses.', requirements: ['3+ years engineering management','Payments or fintech background','Hiring and mentoring track record','Technical depth in distributed systems','Strong written communication'] },
  { id: 110, role: 'Senior UX Designer',           company: 'Airbnb',       loc: 'San Francisco, CA', match: 85, type: 'Full-time',         color: '#FF5A5F', domain: 'airbnb.com',        linkedinSlug: 'airbnb',          portals: ['linkedin','indeed'], salary: '$150k–$195k', period: 'USD/yr', postedDaysAgo: 7,  tags: ['Travel','Service Design','Figma'],                desc: 'Design experiences that help people belong anywhere — across web, mobile, and host-facing products at Airbnb.', requirements: ['5+ years UX/product design','Consumer marketplace experience','End-to-end design portfolio','User research skills','Storytelling with design'] },
  { id: 111, role: 'Data Scientist',               company: 'Uber',         loc: 'San Francisco, CA', match: 83, type: 'Full-time',         color: '#000000', domain: 'uber.com',          linkedinSlug: 'uber',            portals: ['linkedin','indeed'], salary: '$155k–$200k', period: 'USD/yr', postedDaysAgo: 9,  tags: ['Python','Causal Inference','Marketplace ML'],     desc: 'Drive marketplace intelligence at Uber — pricing, demand forecasting, and driver/rider matching models at global scale.', requirements: ['3+ years data science','Python and SQL proficiency','Causal inference and A/B testing','Marketplace or ridesharing domain','Strong stakeholder communication'] },
  { id: 112, role: 'Senior Product Manager',       company: 'Figma',        loc: 'San Francisco, CA', match: 91, type: 'Full-time',         color: '#F24E1E', domain: 'figma.com',         linkedinSlug: 'figma',           portals: ['linkedin','indeed'], salary: '$175k–$215k', period: 'USD/yr', postedDaysAgo: 3,  tags: ['Design Tools','Developer API','PLG'],             desc: 'Lead product for Figma\'s plugin ecosystem and developer platform used by 8M+ designers and engineers.', requirements: ['5+ years PM experience','Developer tools or design tool background','API product experience','PLG expertise','Strong technical depth'] },
  { id: 113, role: 'Senior Product Manager',       company: 'Notion',       loc: 'Remote',            match: 88, type: 'Remote · Full-time', color: '#000000', domain: 'notion.so',         linkedinSlug: 'notionhq',        portals: ['linkedin','indeed'], salary: '$160k–$200k', period: 'USD/yr', postedDaysAgo: 5,  tags: ['Productivity','B2B SaaS','PLG'],                  desc: 'Own the product roadmap for Notion\'s AI-powered workspace tools used by 30M+ teams worldwide.', requirements: ['5+ years PM experience','B2B SaaS and PLG expertise','Strong writing skills','AI product experience a plus','Async-first work style'] },
  { id: 114, role: 'Staff Engineer',               company: 'Vercel',       loc: 'Remote',            match: 90, type: 'Remote · Full-time', color: '#000000', domain: 'vercel.com',         linkedinSlug: 'vercel',         portals: ['linkedin','indeed'], salary: '$175k–$215k', period: 'USD/yr', postedDaysAgo: 1,  tags: ['Next.js','Edge Computing','TypeScript'],          desc: 'Build the edge infrastructure and developer experience platform that powers millions of Next.js deployments globally.', requirements: ['6+ years engineering','TypeScript and Node.js expertise','Edge computing knowledge','Open source contributions a plus','Async communication'] },
  { id: 115, role: 'Senior Engineer',              company: 'Salesforce',   loc: 'San Francisco, CA', match: 82, type: 'Full-time',         color: '#00A1E0', domain: 'salesforce.com',    linkedinSlug: 'salesforce',      portals: ['linkedin','indeed'], salary: '$165k–$210k', period: 'USD/yr', postedDaysAgo: 12, tags: ['Java','CRM','Enterprise SaaS'],                   desc: 'Build the CRM platform infrastructure used by 150,000+ companies worldwide, from SMBs to Fortune 500s.', requirements: ['4+ years engineering','Java or Apex expertise','Enterprise SaaS background','Scalable architecture','Customer-focused engineering'] },
  { id: 116, role: 'Product Manager',              company: 'LinkedIn',     loc: 'Sunnyvale, CA',     match: 86, type: 'Full-time',         color: '#0A66C2', domain: 'linkedin.com',      linkedinSlug: 'linkedin',        portals: ['linkedin','indeed'], salary: '$170k–$220k', period: 'USD/yr', postedDaysAgo: 6,  tags: ['Professional Network','Feed','B2B Growth'],       desc: 'Shape the LinkedIn feed and content discovery experience for 950M+ professionals across 200 countries.', requirements: ['4+ years PM experience','Social or content product background','Data-driven','Stakeholder management','Passion for professional development'] },
  { id: 117, role: 'ML Research Engineer',         company: 'Nvidia',       loc: 'Santa Clara, CA',   match: 89, type: 'Full-time',         color: '#76B900', domain: 'nvidia.com',        linkedinSlug: 'nvidia',          portals: ['linkedin','indeed'], salary: '$200k–$290k', period: 'USD/yr', postedDaysAgo: 4,  tags: ['CUDA','Deep Learning','GPU Architecture'],        desc: 'Research and implement ML algorithms that run on NVIDIA GPUs — from training to inference optimization.', requirements: ['PhD or 4+ years ML research','CUDA programming','Deep learning frameworks','GPU architecture knowledge','Published research preferred'] },
  { id: 118, role: 'Software Engineer',            company: 'Palantir',     loc: 'New York, NY',      match: 80, type: 'Full-time',         color: '#1C1C1C', domain: 'palantir.com',      linkedinSlug: 'palantir-technologies', portals: ['linkedin','indeed'], salary: '$120k–$165k', period: 'USD/yr', postedDaysAgo: 10, tags: ['Data Platform','Government Tech','Java'],          desc: 'Build and deploy Palantir\'s data analytics platforms for defense, intelligence, and commercial customers.', requirements: ['2+ years engineering','Java or Python expertise','Data pipeline experience','Interest in government/enterprise tech','Eligible for security clearance'] },
  { id: 119, role: 'Senior Software Engineer',     company: 'Bloomberg',    loc: 'New York, NY',      match: 83, type: 'Full-time',         color: '#F26522', domain: 'bloomberg.com',     linkedinSlug: 'bloomberg',       portals: ['linkedin','indeed'], salary: '$155k–$195k', period: 'USD/yr', postedDaysAgo: 14, tags: ['C++','Financial Data','Real-Time Systems'],       desc: 'Build the financial data infrastructure powering Bloomberg Terminal used by 325,000+ financial professionals worldwide.', requirements: ['4+ years engineering','C++ or Python expertise','Low-latency systems','Financial data domain a plus','Distributed systems'] },
  { id: 120, role: 'Product Manager',              company: 'Coinbase',     loc: 'Remote',            match: 84, type: 'Remote · Full-time', color: '#0052FF', domain: 'coinbase.com',      linkedinSlug: 'coinbase',        portals: ['linkedin','indeed'], salary: '$165k–$210k', period: 'USD/yr', postedDaysAgo: 2,  tags: ['Crypto','Web3','Consumer Fintech'],               desc: 'Own the product roadmap for Coinbase\'s retail trading experience used by 110M+ verified users across 100+ countries.', requirements: ['4+ years PM experience','Fintech or crypto background','Consumer product experience','Data-driven decision making','Strong technical depth'] },
]

const CANADA_JOBS: Job[] = [
  { id: 201, role: 'Senior Software Engineer',     company: 'Shopify',       loc: 'Ottawa, ON',        match: 94, type: 'Remote · Full-time', color: '#96BF48', domain: 'shopify.com',       linkedinSlug: 'shopify',          portals: ['linkedin','indeed'], salary: 'CA$130k–$180k', period: 'CAD/yr', postedDaysAgo: 0,  tags: ['Ruby','React','E-commerce'],                     desc: 'Build the commerce infrastructure powering 1.7M+ merchants globally at Shopify. Fully distributed, remote-first team.', requirements: ['4+ years engineering','Ruby on Rails or Go expertise','E-commerce domain knowledge','Remote collaboration skills','Open source contributions a plus'] },
  { id: 202, role: 'Product Manager',              company: 'Shopify',       loc: 'Remote',            match: 91, type: 'Remote · Full-time', color: '#96BF48', domain: 'shopify.com',       linkedinSlug: 'shopify',          portals: ['linkedin','indeed'], salary: 'CA$120k–$165k', period: 'CAD/yr', postedDaysAgo: 2,  tags: ['Merchant Platform','PLG','Checkout'],             desc: 'Drive product strategy for Shopify\'s merchant-facing platform and checkout experience used by millions of businesses.', requirements: ['4+ years PM experience','E-commerce or marketplace background','PLG expertise','Data-driven','Strong async writing'] },
  { id: 203, role: 'Senior Data Scientist',        company: 'RBC',           loc: 'Toronto, ON',       match: 85, type: 'Full-time',         color: '#005DAA', domain: 'rbc.com',            linkedinSlug: 'rbc',              portals: ['linkedin','indeed'], salary: 'CA$100k–$140k', period: 'CAD/yr', postedDaysAgo: 3,  tags: ['Python','Banking ML','Risk Models'],              desc: 'Build ML models for credit risk, fraud detection, and customer analytics at Canada\'s largest bank serving 17M clients.', requirements: ['3+ years data science','Python/R and SQL','Financial services domain','Risk or fraud ML experience','Strong stakeholder communication'] },
  { id: 204, role: 'Product Designer',             company: 'Wealthsimple',  loc: 'Toronto, ON',       match: 89, type: 'Full-time',         color: '#000000', domain: 'wealthsimple.com',  linkedinSlug: 'wealthsimple',     portals: ['linkedin','indeed'], salary: 'CA$105k–$145k', period: 'CAD/yr', postedDaysAgo: 1,  tags: ['Fintech','iOS Design','Figma'],                   desc: 'Design the next generation of personal finance tools at Wealthsimple — Canada\'s leading digital investing platform with 3M+ clients.', requirements: ['4+ years product design','Fintech or consumer app portfolio','iOS/Android design','User research skills','Systems thinking'] },
  { id: 205, role: 'Full Stack Engineer',          company: 'Hootsuite',     loc: 'Vancouver, BC',     match: 82, type: 'Full-time',         color: '#F5A623', domain: 'hootsuite.com',      linkedinSlug: 'hootsuite',        portals: ['linkedin','indeed'], salary: 'CA$95k–$130k',  period: 'CAD/yr', postedDaysAgo: 8,  tags: ['React','Node.js','Social Media'],                 desc: 'Build Hootsuite\'s social media management platform used by 200,000+ organizations across 175+ countries.', requirements: ['3+ years full-stack','React and Node.js proficiency','SaaS experience','REST and GraphQL APIs','Strong testing practices'] },
  { id: 206, role: 'Software Engineer',            company: 'Lightspeed',    loc: 'Montreal, QC',      match: 80, type: 'Full-time',         color: '#FF6B35', domain: 'lightspeedhq.com',  linkedinSlug: 'lightspeed-commerce', portals: ['linkedin','indeed'], salary: 'CA$90k–$130k',  period: 'CAD/yr', postedDaysAgo: 11, tags: ['PHP','React','POS Systems'],                     desc: 'Build cloud-based POS and e-commerce systems for restaurants and retailers at Lightspeed Commerce, serving 150,000+ businesses.', requirements: ['3+ years engineering','PHP or Go and React expertise','B2B SaaS experience','Payment systems knowledge','Agile development'] },
  { id: 207, role: 'Product Manager',              company: 'Scotiabank',    loc: 'Toronto, ON',       match: 78, type: 'Full-time',         color: '#EC111A', domain: 'scotiabank.com',     linkedinSlug: 'scotiabank',       portals: ['linkedin','indeed'], salary: 'CA$90k–$125k',  period: 'CAD/yr', postedDaysAgo: 15, tags: ['Digital Banking','Mobile App','Agile'],           desc: 'Drive the product roadmap for Scotiabank\'s mobile banking app serving 10M+ Canadians across iOS and Android.', requirements: ['3+ years PM experience','Banking or fintech background','Mobile product experience','Agile/Scrum','Stakeholder management'] },
  { id: 208, role: 'ML Engineer',                  company: 'CIBC',          loc: 'Toronto, ON',       match: 83, type: 'Full-time',         color: '#C41F3E', domain: 'cibc.com',           linkedinSlug: 'cibc',             portals: ['linkedin','indeed'], salary: 'CA$100k–$145k', period: 'CAD/yr', postedDaysAgo: 6,  tags: ['Python','NLP','Financial ML'],                   desc: 'Build machine learning models for fraud detection, personalization, and credit risk at one of Canada\'s Big Five banks.', requirements: ['3+ years ML engineering','Python and TensorFlow/PyTorch','NLP experience','Financial services preferred','Model deployment at scale'] },
  { id: 209, role: 'Business Analyst',             company: 'TD Bank',       loc: 'Toronto, ON',       match: 76, type: 'Full-time',         color: '#34B233', domain: 'td.com',             linkedinSlug: 'td-bank',          portals: ['linkedin','indeed'], salary: 'CA$75k–$105k',  period: 'CAD/yr', postedDaysAgo: 20, tags: ['SQL','JIRA','Banking'],                           desc: 'Translate business requirements into technical specs for TD\'s digital banking transformation across retail and commercial banking.', requirements: ['2+ years BA experience','Banking or financial domain','SQL proficiency','Requirements documentation','JIRA and Confluence'] },
  { id: 210, role: 'Senior Software Engineer',     company: 'Coveo',         loc: 'Remote',            match: 87, type: 'Remote · Full-time', color: '#F26931', domain: 'coveo.com',          linkedinSlug: 'coveo',            portals: ['linkedin','indeed'], salary: 'CA$100k–$140k', period: 'CAD/yr', postedDaysAgo: 3,  tags: ['Search AI','TypeScript','Cloud'],                 desc: 'Build AI-powered search and relevance products at Coveo, powering enterprise search for Salesforce, ServiceNow, and 500+ customers.', requirements: ['4+ years engineering','TypeScript and AWS expertise','Search or AI SaaS background','Microservices architecture','Remote-first mindset'] },
  { id: 211, role: 'Product Manager',              company: 'Telus',         loc: 'Vancouver, BC',     match: 79, type: 'Full-time',         color: '#4B286D', domain: 'telus.com',          linkedinSlug: 'telus',            portals: ['linkedin','indeed'], salary: 'CA$90k–$125k',  period: 'CAD/yr', postedDaysAgo: 9,  tags: ['Telecom','Mobile','Digital Products'],            desc: 'Drive product strategy for Telus\'s digital and mobile products serving 17M+ Canadian subscribers.', requirements: ['3+ years PM experience','Telecom or consumer product background','Mobile product expertise','Data-driven','Strong cross-functional collaboration'] },
  { id: 212, role: 'Senior Software Engineer',     company: 'Ada',           loc: 'Toronto, ON',       match: 88, type: 'Full-time',         color: '#5C2D91', domain: 'ada.cx',             linkedinSlug: 'ada-support',      portals: ['linkedin','indeed'], salary: 'CA$115k–$158k', period: 'CAD/yr', postedDaysAgo: 2,  tags: ['Python','Conversational AI','SaaS'],              desc: 'Build Ada\'s AI-powered customer service automation platform used by Zoom, Meta, and 300+ global brands.', requirements: ['4+ years engineering','Python and TypeScript expertise','AI or NLP experience','B2B SaaS background','Startup engineering culture'] },
  { id: 213, role: 'Data Analyst',                 company: 'Manulife',      loc: 'Toronto, ON',       match: 74, type: 'Full-time',         color: '#00A758', domain: 'manulife.com',       linkedinSlug: 'manulife',         portals: ['linkedin','indeed'], salary: 'CA$72k–$100k',  period: 'CAD/yr', postedDaysAgo: 22, tags: ['SQL','Tableau','Insurance Analytics'],            desc: 'Drive data insights for Manulife\'s insurance and wealth management products serving 33M+ customers across North America and Asia.', requirements: ['2+ years data analysis','SQL and Python proficiency','Tableau or Power BI','Financial services preferred','Statistical analysis'] },
  { id: 214, role: 'Operations Manager',           company: 'DoorDash',      loc: 'Toronto, ON',       match: 77, type: 'Full-time',         color: '#EF2D2D', domain: 'doordash.com',       linkedinSlug: 'doordash',         portals: ['linkedin','indeed'], salary: 'CA$85k–$115k',  period: 'CAD/yr', postedDaysAgo: 16, tags: ['Marketplace Ops','Supply Growth','Analytics'],   desc: 'Lead marketplace operations for DoorDash Canada — managing merchant supply, dasher growth, and city-level P&L across major markets.', requirements: ['3+ years operations','Marketplace or on-demand background','Data analysis skills','P&L ownership','Cross-functional leadership'] },
  { id: 215, role: 'Senior Consultant',            company: 'OpenText',      loc: 'Waterloo, ON',      match: 81, type: 'Full-time',         color: '#005F9E', domain: 'opentext.com',       linkedinSlug: 'opentext',         portals: ['linkedin','indeed'], salary: 'CA$88k–$122k',  period: 'CAD/yr', postedDaysAgo: 13, tags: ['Enterprise Software','Cloud','Consulting'],       desc: 'Deliver cloud and information management solutions for OpenText\'s Fortune 500 enterprise customers across North America and Europe.', requirements: ['3+ years consulting or solutions engineering','Enterprise software background','Cloud platforms (AWS/Azure)','Client-facing communication','Information management domain'] },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function detectCountry(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (tz.includes('Kolkata') || tz.includes('Calcutta')) return 'IN'
  if (navigator.language === 'en-IN') return 'IN'
  if (navigator.language === 'en-CA' || tz.includes('Toronto') || tz.includes('Vancouver') || tz.includes('Montreal')) return 'CA'
  if (tz.startsWith('America/') || navigator.language === 'en-US') return 'US'
  return 'GLOBAL'
}
function matchColor(pct: number) {
  if (pct >= 90) return '#10B981'
  if (pct >= 80) return '#F59E0B'
  return '#6B7280'
}
function toSlug(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }
function formatPosted(days: number): string {
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7)  return `${days} days ago`
  if (days < 14) return '1 week ago'
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return '1 month ago'
}

function getPortalUrl(key: string, job: Job, country: string) {
  const combined = encodeURIComponent(`${job.role} ${job.company}`)
  const citySlug = toSlug(job.loc.split(',')[0].trim())
  const cityEnc  = encodeURIComponent(job.loc.split(',')[0].trim())
  if (key === 'linkedin') return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(`${job.role} ${job.company}`)}&location=${encodeURIComponent(job.loc)}&f_TPR=r2592000`
  if (key === 'indeed') {
    if (country === 'IN') return `https://in.indeed.com/jobs?q=${combined}&l=${cityEnc}`
    if (country === 'CA') return `https://ca.indeed.com/jobs?q=${combined}&l=${encodeURIComponent(job.loc)}`
    return `https://www.indeed.com/jobs?q=${combined}&l=${encodeURIComponent(job.loc)}`
  }
  if (key === 'naukri')   return `https://www.naukri.com/${toSlug(job.role)}-${toSlug(job.company)}-jobs-in-${citySlug}`
  return '#'
}

// ── Company Logo (Clearbit with fallback) ─────────────────────────────────────
function CompanyLogo({ domain, company, color, size = 36 }: { domain: string; company: string; color: string; size?: number }) {
  const [err, setErr] = useState(false)
  const r = size * 0.25
  if (err) {
    return <div style={{ width: size, height: size, borderRadius: r, background: color, flexShrink: 0, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.44 }}>{company[0].toUpperCase()}</div>
  }
  return (
    <div style={{ width: size, height: size, borderRadius: r, background: '#fff', border: '1px solid #e5eaf5', flexShrink: 0, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
      <img src={`https://logo.clearbit.com/${domain}`} alt={company} width={size - 10} height={size - 10} style={{ objectFit: 'contain' }} onError={() => setErr(true)} />
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const IcoClose = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
)
const IcoCheck = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IcoExternal = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
)
const IcoSearch = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)

const PORTAL_META = {
  linkedin: { name: 'LinkedIn',  color: '#0A66C2', bg: '#EFF6FF', desc: 'Company\'s jobs page',     icon: <svg width={20} height={20} viewBox="0 0 24 24" fill="#0A66C2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg> },
  indeed:   { name: 'Indeed',    color: '#003A9B', bg: '#EFF3FF', desc: 'Millions of live listings', icon: <svg width={20} height={20} viewBox="0 0 36 36"><rect width="36" height="36" rx="7" fill="#003A9B"/><text x="8" y="26" fontSize="20" fontWeight="bold" fill="white" fontFamily="Arial">i</text></svg> },
  naukri:   { name: 'Naukri',    color: '#FF7555', bg: '#FFF4F0', desc: 'India\'s #1 job portal',   icon: <svg width={20} height={20} viewBox="0 0 36 36"><rect width="36" height="36" rx="7" fill="#FF7555"/><text x="5" y="26" fontSize="19" fontWeight="bold" fill="white" fontFamily="Arial">N</text></svg> },
} as const

const FILTERS = ['All Opportunities', 'Remote Only', 'Best Match', 'Latest']

const JOB_SETS: Record<string, Job[]> = {
  IN: INDIA_JOBS,
  US: USA_JOBS,
  CA: CANADA_JOBS,
  GLOBAL: GLOBAL_JOBS,
}

const CITY_OPTIONS: Record<string, string[]> = {
  IN: ['All Locations', 'Remote', 'Bangalore', 'Mumbai', 'Gurugram', 'Pune', 'Hyderabad', 'Noida', 'Chennai'],
  US: ['All Locations', 'Remote', 'San Francisco, CA', 'Mountain View, CA', 'Menlo Park, CA', 'Seattle, WA', 'Redmond, WA', 'Cupertino, CA', 'Sunnyvale, CA', 'Santa Clara, CA', 'New York, NY'],
  CA: ['All Locations', 'Remote', 'Toronto, ON', 'Vancouver, BC', 'Ottawa, ON', 'Montreal, QC', 'Waterloo, ON'],
  GLOBAL: ['All Locations', 'Remote', 'San Francisco', 'New York, NY'],
}

const COUNTRY_META: Record<string, { flag: string; label: string; currency: string }> = {
  IN:     { flag: '🇮🇳', label: 'India',         currency: 'LPA (₹)' },
  US:     { flag: '🇺🇸', label: 'United States',  currency: 'USD/yr' },
  CA:     { flag: '🇨🇦', label: 'Canada',         currency: 'CAD/yr' },
  GLOBAL: { flag: '🌍', label: 'Global',          currency: 'Mixed' },
}

export default function JobMatch() {
  const { user } = useAuth()
  const [country,      setCountry]      = useState(() => detectCountry())
  const [activeFilter, setActiveFilter] = useState('All Opportunities')
  const [cityFilter,   setCityFilter]   = useState('All Locations')
  const [roleSearch,   setRoleSearch]   = useState('')
  const [companySearch,setCompanySearch] = useState('')
  const [dateFilter,   setDateFilter]   = useState('Any Time')
  const [detailJob,    setDetailJob]    = useState<Job | null>(null)
  const [applyJob,     setApplyJob]     = useState<Job | null>(null)

  const allJobs  = JOB_SETS[country] ?? GLOBAL_JOBS
  const cities   = CITY_OPTIONS[country] ?? CITY_OPTIONS.GLOBAL

  function switchCountry(c: string) {
    setCountry(c)
    setCityFilter('All Locations')
    setActiveFilter('All Opportunities')
    setRoleSearch('')
    setCompanySearch('')
    setDateFilter('Any Time')
  }

  const relevantJobs = [...allJobs].sort((a, b) => {
    const title = (user?.jobTitle ?? '').toLowerCase()
    const aM = a.role.toLowerCase().includes(title) || a.tags.some(t => t.toLowerCase().includes(title))
    const bM = b.role.toLowerCase().includes(title) || b.tags.some(t => t.toLowerCase().includes(title))
    if (aM && !bM) return -1
    if (!aM && bM) return 1
    return b.match - a.match
  })

  const filtered = relevantJobs.filter(j => {
    if (activeFilter === 'Remote Only' && !j.loc.toLowerCase().includes('remote')) return false
    if (activeFilter === 'Best Match'  && j.match < 85) return false
    if (cityFilter !== 'All Locations' && !j.loc.toLowerCase().includes(cityFilter.split(',')[0].toLowerCase())) return false
    if (dateFilter === 'Last 24 Hours' && j.postedDaysAgo > 1)  return false
    if (dateFilter === 'Last Week'     && j.postedDaysAgo > 7)  return false
    if (dateFilter === 'Last Month'    && j.postedDaysAgo > 30) return false
    if (roleSearch    && !j.role.toLowerCase().includes(roleSearch.toLowerCase()))       return false
    if (companySearch && !j.company.toLowerCase().includes(companySearch.toLowerCase())) return false
    return true
  })

  const highMatches  = allJobs.filter(j => j.match >= 85).length
  const remoteCount  = allJobs.filter(j => j.loc.toLowerCase().includes('remote')).length
  const avgMatch     = Math.round(allJobs.reduce((s, j) => s + j.match, 0) / allJobs.length)

  const openPortal = (key: string, job: Job) => {
    window.open(getPortalUrl(key, job, country), '_blank')
  }

  const countryMeta = COUNTRY_META[country]

  return (
    <>
      {/* Header */}
      <div className="jm-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 6 }}>
          <div>
            <h1 style={{ marginBottom: 6 }}>Architected for <em>Success.</em></h1>
            <p style={{ margin: 0 }}>
              {country === 'IN'
                ? `AI-matched roles across India's top tech companies, tailored for ${user?.jobTitle ?? 'your profile'}.`
                : country === 'US'
                  ? `Showing top US tech roles matched to your profile. Salaries in USD.`
                  : country === 'CA'
                    ? `Showing Canada's top companies matched to your profile. Salaries in CAD.`
                    : `AI engine matched your profile against global listings across top companies.`}
            </p>
          </div>
          {/* Country selector */}
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {Object.entries(COUNTRY_META).map(([code, meta]) => (
              <button
                key={code}
                onClick={() => switchCountry(code)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                  borderRadius: 8, border: `1.5px solid ${country === code ? 'var(--accent)' : 'var(--border)'}`,
                  background: country === code ? 'var(--blue-50)' : 'var(--bg-soft)',
                  color: country === code ? 'var(--accent)' : 'var(--text-mute)',
                  fontWeight: country === code ? 700 : 500, fontSize: 12.5,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 16 }}>{meta.flag}</span>
                <span style={{ display: 'none' }}>{meta.label}</span>
                <span style={{ display: 'block', fontSize: 11, fontWeight: 600 }}>{code}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="jm-header-stats">
          <div className="jm-stat-pill"><div className="jm-num">{highMatches}</div><div className="jm-lbl">HIGH MATCHES</div></div>
          <div className="jm-stat-pill"><div className="jm-num">{avgMatch}%</div><div className="jm-lbl">PROFILE FIT</div></div>
          <div className="jm-stat-pill"><div className="jm-num">{allJobs.length}</div><div className="jm-lbl">{countryMeta.label.toUpperCase()} JOBS</div></div>
          <div className="jm-stat-pill" style={{ cursor: 'pointer' }} onClick={() => setActiveFilter('Remote Only')}><div className="jm-num" style={{ color: '#10B981' }}>{remoteCount}</div><div className="jm-lbl">REMOTE JOBS</div></div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="jm-filter-bar" style={{ flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flex: 1, minWidth: 0 }}>
          {FILTERS.map(f => (
            <button key={f} className={`jm-filter-btn${activeFilter === f ? ' active' : ''}`} onClick={() => setActiveFilter(f)}>{f}</button>
          ))}
          <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="jm-filter-btn"
            style={{ borderColor: cityFilter !== 'All Locations' ? 'var(--border-strong)' : 'transparent', paddingRight: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="jm-filter-btn"
            style={{ borderColor: dateFilter !== 'Any Time' ? 'var(--border-strong)' : 'transparent', paddingRight: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
            <option>Any Time</option>
            <option>Last 24 Hours</option>
            <option>Last Week</option>
            <option>Last Month</option>
          </select>
        </div>
        {/* Separate search boxes */}
        <div style={{ display: 'flex', gap: 8, flex: '0 0 auto' }}>
          <div className="jm-search">
            <IcoSearch />
            <input placeholder="Search by role…" value={roleSearch} onChange={e => setRoleSearch(e.target.value)} style={{ width: 140 }} />
            {roleSearch && <button onClick={() => setRoleSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-mute)', cursor: 'pointer', padding: 0, display: 'flex' }}><IcoClose /></button>}
          </div>
          <div className="jm-search">
            <IcoSearch />
            <input placeholder="Search by company…" value={companySearch} onChange={e => setCompanySearch(e.target.value)} style={{ width: 150 }} />
            {companySearch && <button onClick={() => setCompanySearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-mute)', cursor: 'pointer', padding: 0, display: 'flex' }}><IcoClose /></button>}
          </div>
        </div>
      </div>

      {/* Notices */}
      <div style={{ background: 'var(--blue-50)', border: '1px solid var(--blue-200)', borderRadius: 8, padding: '9px 14px', marginBottom: 10, fontSize: 13, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
        {countryMeta.flag} Showing jobs in <b>{countryMeta.label}</b>. Salaries in <b>{countryMeta.currency}</b>. Switch country above to explore other markets.
      </div>
      <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px', marginBottom: 18, fontSize: 12, color: 'var(--text-mute)', display: 'flex', alignItems: 'center', gap: 6 }}>
        ℹ️ AI-curated sample roles. <b>Quick Apply</b> opens real listings on the portals available for each job — only showing portals that carry that role.
      </div>

      {/* Results count */}
      <div style={{ fontSize: 12.5, color: 'var(--text-mute)', marginBottom: 12 }}>
        Showing <b style={{ color: 'var(--text)' }}>{filtered.length}</b> of {allJobs.length} roles
        {(roleSearch || companySearch || dateFilter !== 'Any Time' || cityFilter !== 'All Locations') && <button onClick={() => { setRoleSearch(''); setCompanySearch(''); setDateFilter('Any Time'); setCityFilter('All Locations') }} style={{ marginLeft: 10, fontSize: 11.5, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>Clear filters ×</button>}
      </div>

      {/* Job grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-mute)' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
          No roles match your search. Try adjusting the filters or search terms.
        </div>
      ) : (
        <div className="jm-grid">
          {filtered.map(job => (
            <div key={job.id} className="job-card">
              <div className="match-badge" style={{ background: `${matchColor(job.match)}20`, color: matchColor(job.match), border: `1px solid ${matchColor(job.match)}40` }}>
                {job.match}% Match
              </div>
              <div className="jc-head">
                <CompanyLogo domain={job.domain} company={job.company} color={job.color} size={36} />
                <div>
                  <div className="jc-role">{job.role}</div>
                  <div className="jc-co">{job.company} · {job.loc}</div>
                </div>
              </div>
              <div className="jc-desc">{job.desc}</div>
              <div className="jc-tags">{job.tags.map(t => <span key={t} className="jc-tag">{t}</span>)}</div>
              {/* Available portals row */}
              <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                {job.portals.map(p => (
                  <span key={p} style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: PORTAL_META[p].bg, color: PORTAL_META[p].color, border: `1px solid ${PORTAL_META[p].color}30` }}>
                    {PORTAL_META[p].name}
                  </span>
                ))}
              </div>
              <div className="jc-footer">
                <div>
                  <div className="jc-salary">{job.salary} <span>{job.period}</span></div>
                  <div style={{ fontSize: 11, color: job.postedDaysAgo <= 1 ? '#10B981' : 'var(--text-mute)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {formatPosted(job.postedDaysAgo)}
                  </div>
                </div>
                <div className="jc-actions">
                  <button className="btn-jc-secondary" onClick={() => setDetailJob(job)}>Details</button>
                  <button className="btn-jc-primary" onClick={() => setApplyJob(job)}>Quick Apply</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Detail Panel ─────────────────────────────────────── */}
      {detailJob && (
        <>
          <div className="jm-detail-backdrop" onClick={() => setDetailJob(null)} />
          <div className="jm-detail-panel">
            <div className="jm-detail-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <CompanyLogo domain={detailJob.domain} company={detailJob.company} color={detailJob.color} size={40} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', lineHeight: 1.2 }}>{detailJob.role}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-mute)', marginTop: 2 }}>{detailJob.company} · {detailJob.loc}</div>
                </div>
              </div>
              <button className="jm-detail-close" onClick={() => setDetailJob(null)}><IcoClose /></button>
            </div>
            <div className="jm-detail-body">
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{ background: `${matchColor(detailJob.match)}18`, color: matchColor(detailJob.match), border: `1px solid ${matchColor(detailJob.match)}40`, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>{detailJob.match}% Match</span>
                <span style={{ fontSize: 12, color: 'var(--text-mute)', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 20, padding: '3px 10px' }}>{detailJob.type}</span>
              </div>
              <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-mute)', marginBottom: 4 }}>COMPENSATION</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{detailJob.salary}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-mute)' }}>{detailJob.period}</div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-mute)', marginBottom: 8 }}>ABOUT THIS ROLE</div>
                <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.65, margin: 0 }}>{detailJob.desc}</p>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-mute)', marginBottom: 10 }}>REQUIREMENTS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {detailJob.requirements.map((req, i) => (
                    <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                      <span style={{ width: 18, height: 18, borderRadius: 5, background: 'var(--blue-50)', color: 'var(--accent)', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}><IcoCheck /></span>
                      <span style={{ fontSize: 12.5, color: 'var(--text-soft)', lineHeight: 1.5 }}>{req}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-mute)', marginBottom: 8 }}>KEY SKILLS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{detailJob.tags.map(t => <span key={t} className="jc-tag">{t}</span>)}</div>
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-mute)', marginBottom: 10 }}>APPLY VIA</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                {detailJob.portals.map(p => {
                  const m = PORTAL_META[p]
                  return (
                    <button key={p} onClick={() => openPortal(p, detailJob)} className="jm-portal-btn"
                      style={{ '--portal-color': m.color, '--portal-bg': m.bg } as React.CSSProperties}>
                      <span className="jm-portal-icon">{m.icon}</span>
                      <span className="jm-portal-info"><span className="jm-portal-name">{m.name}</span><span className="jm-portal-desc">{m.desc}</span></span>
                      <IcoExternal size={13} />
                    </button>
                  )
                })}
              </div>
              <button onClick={() => setDetailJob(null)} style={{ width: '100%', height: 38, borderRadius: 9, background: 'none', color: 'var(--text-mute)', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Close</button>
            </div>
          </div>
        </>
      )}

      {/* ── Apply Portal Modal ────────────────────────────────── */}
      {applyJob && (
        <div className="jm-apply-backdrop" onClick={() => setApplyJob(null)}>
          <div className="jm-apply-modal" onClick={e => e.stopPropagation()}>
            <div className="jm-apply-modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CompanyLogo domain={applyJob.domain} company={applyJob.company} color={applyJob.color} size={36} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text)' }}>{applyJob.role}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-mute)' }}>{applyJob.company} · {applyJob.loc}</div>
                </div>
              </div>
              <button className="jm-detail-close" onClick={() => setApplyJob(null)}><IcoClose /></button>
            </div>
            <div style={{ padding: '14px 18px 18px' }}>
              <div style={{ fontSize: 12.5, color: 'var(--text-mute)', marginBottom: 14 }}>
                Available on <b>{applyJob.portals.length}</b> portal{applyJob.portals.length > 1 ? 's' : ''} — choose where to apply:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {applyJob.portals.map(p => {
                  const m = PORTAL_META[p]
                  return (
                    <button key={p} onClick={() => { openPortal(p, applyJob); setApplyJob(null) }} className="jm-portal-btn jm-portal-btn-lg"
                      style={{ '--portal-color': m.color, '--portal-bg': m.bg } as React.CSSProperties}>
                      <span className="jm-portal-icon">{m.icon}</span>
                      <span className="jm-portal-info"><span className="jm-portal-name">{m.name}</span><span className="jm-portal-desc">{m.desc}</span></span>
                      <IcoExternal size={13} />
                    </button>
                  )
                })}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-mute)', textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
                Opens the company's page or a filtered job search for this role.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
