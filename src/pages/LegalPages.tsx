import StaticPage from '../components/site/StaticPage'

type PageProps = { theme: string; toggleTheme: () => void }

export function Privacy({ theme, toggleTheme }: PageProps) {
  return (
    <StaticPage theme={theme} toggleTheme={toggleTheme} eyebrow="Legal" title="Privacy Policy" updated="August 2026">
      <h2>What we collect</h2>
      <p>To provide JobEarly's resume tailoring, ATS scoring, cover letter generation, job tracking, and outreach features, we collect the information you give us directly: your name, email, job title, resume content, job descriptions you paste in, application history you log, and outreach messages you send through the product.</p>

      <h2>How we use it</h2>
      <p>Your resume and job description text is sent to our AI provider solely to generate the tailored content, score, or letter you requested. We do not use your resume content, job search history, or outreach messages to train shared or third-party models.</p>

      <h2>Data storage and security</h2>
      <p>Application data is encrypted at rest and in transit. Access is restricted to the systems that need it to serve your requests. We completed a SOC 2 Type II audit in Q1 2026 covering our security controls.</p>

      <h2>Your rights</h2>
      <p>You can export or permanently delete your account data at any time from Settings. If you'd rather we do it for you, email <a href="mailto:hello@jobearly.ai">hello@jobearly.ai</a> and we'll process the request within 30 days.</p>

      <h2>Third parties</h2>
      <p>We share data with the minimum set of processors required to run the product — our AI model provider (to generate resume, cover letter, and analysis content) and, only if you connect it yourself, Google's Gmail API (to read and send outreach email on your behalf, under the scopes you explicitly grant).</p>

      <h2>Contact</h2>
      <p>Questions about this policy? Email <a href="mailto:hello@jobearly.ai">hello@jobearly.ai</a>.</p>
    </StaticPage>
  )
}

export function Terms({ theme, toggleTheme }: PageProps) {
  return (
    <StaticPage theme={theme} toggleTheme={toggleTheme} eyebrow="Legal" title="Terms of Service" updated="August 2026">
      <h2>Using JobEarly</h2>
      <p>By creating an account you agree to use JobEarly for lawful job-search purposes only. You're responsible for the accuracy of the resume and application content you submit — JobEarly tailors and scores what you give it, but doesn't fabricate work history or credentials on your behalf.</p>

      <h2>Plans and billing</h2>
      <p>Free plan limits (resumes, cover letters, and outreach sends) are described on the <a href="/#pricing">Pricing</a> page. Pro is billed monthly or annually and can be cancelled at any time from your account — you keep access through the end of the period you already paid for.</p>

      <h2>Acceptable use</h2>
      <ul>
        <li>No scraping, reverse engineering, or reselling access to the product.</li>
        <li>No using JobEarly's outreach tooling to send unsolicited bulk email outside genuine job applications.</li>
        <li>No uploading content you don't have the right to use.</li>
      </ul>

      <h2>Availability</h2>
      <p>We aim for high uptime but don't guarantee the service will be uninterrupted or error-free. AI-generated content (resumes, cover letters, ATS scores) is a drafting aid — review everything before you submit it to an employer.</p>

      <h2>Termination</h2>
      <p>You can delete your account at any time from Settings. We may suspend accounts that violate the acceptable use terms above.</p>

      <h2>Contact</h2>
      <p>Questions about these terms? Email <a href="mailto:hello@jobearly.ai">hello@jobearly.ai</a>.</p>
    </StaticPage>
  )
}

export function Security({ theme, toggleTheme }: PageProps) {
  return (
    <StaticPage theme={theme} toggleTheme={toggleTheme} eyebrow="Legal" title="Security" updated="August 2026">
      <h2>Our approach</h2>
      <p>JobEarly handles resumes, job search history, and outreach email content — data people reasonably expect to stay private during a job hunt. Security controls are built around that assumption.</p>

      <div className="static-card">
        <h3>Encryption</h3>
        <p>Data is encrypted in transit (TLS) and at rest. Access to production data is limited to the services that need it to fulfil your requests.</p>
      </div>
      <div className="static-card">
        <h3>Compliance</h3>
        <p>SOC 2 Type II audit completed Q1 2026, covering security, availability, and confidentiality controls.</p>
      </div>
      <div className="static-card">
        <h3>Account access</h3>
        <p>Gmail integration uses OAuth with the minimum scopes needed (read + send) — we never see or store your Gmail password, and you can revoke access at any time from your Google Account settings.</p>
      </div>

      <h2>Reporting a vulnerability</h2>
      <p>Found a security issue? Email <a href="mailto:hello@jobearly.ai">hello@jobearly.ai</a> with details — we take reports seriously and will respond as quickly as we can.</p>
    </StaticPage>
  )
}

export function Dpa({ theme, toggleTheme }: PageProps) {
  return (
    <StaticPage theme={theme} toggleTheme={toggleTheme} eyebrow="Legal" title="Data Processing Agreement" updated="August 2026">
      <p className="sub" style={{ marginBottom: 24 }}>This page summarizes the terms under which JobEarly processes personal data on your behalf as part of the service. It's provided for transparency; if your organization needs a signed DPA for procurement purposes, contact us.</p>

      <h2>Roles</h2>
      <p>For data you submit to tailor resumes, generate cover letters, or send outreach, JobEarly acts as the data processor and you (the account holder) are the data controller.</p>

      <h2>Subprocessors</h2>
      <ul>
        <li>Our AI model provider — processes resume and job description text to generate tailored content and scores.</li>
        <li>Google (Gmail API) — only if you connect your Gmail account, to read and send outreach email under scopes you grant.</li>
      </ul>

      <h2>Data retention and deletion</h2>
      <p>Data is retained for as long as your account is active. You can export or delete your data at any time from Settings, or by emailing <a href="mailto:hello@jobearly.ai">hello@jobearly.ai</a>.</p>

      <h2>Requesting a signed copy</h2>
      <p>If your company's procurement process requires an executed DPA, email <a href="mailto:hello@jobearly.ai">hello@jobearly.ai</a> and we'll get one over to you.</p>
    </StaticPage>
  )
}

export function Cookies({ theme, toggleTheme }: PageProps) {
  return (
    <StaticPage theme={theme} toggleTheme={toggleTheme} eyebrow="Legal" title="Cookie Policy" updated="August 2026">
      <h2>What we use cookies for</h2>
      <p>JobEarly uses a minimal set of cookies and browser storage — no third-party ad-tracking cookies.</p>

      <div className="static-card">
        <h3>Essential</h3>
        <p>Keeps you signed in and remembers your theme (light/dark) preference. Required for the product to function.</p>
      </div>
      <div className="static-card">
        <h3>Functional (local storage)</h3>
        <p>Your resumes, cover letters, job tracker entries, and support tickets are stored in your browser's local storage so the app works instantly without a page reload.</p>
      </div>

      <h2>Your choices</h2>
      <p>You can clear cookies and local storage from your browser settings at any time — note that this will sign you out and clear locally-stored drafts that haven't been otherwise saved.</p>

      <h2>Contact</h2>
      <p>Questions? Email <a href="mailto:hello@jobearly.ai">hello@jobearly.ai</a>.</p>
    </StaticPage>
  )
}
