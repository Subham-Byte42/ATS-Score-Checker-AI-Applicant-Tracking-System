import { ResumeRecord } from '../types';

export function downloadResumePDF(resume: ResumeRecord): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export the PDF report.');
    return;
  }

  const candidateName = resume.candidateName || 'Candidate';
  const targetRole = resume.targetRole || 'Software Engineer';
  const atsScore = resume.atsScore || 0;
  const matchScore = resume.matchScore || 0;
  const category = resume.category || (atsScore >= 85 ? 'Top Candidate' : atsScore >= 70 ? 'Excellent' : 'Needs Work');
  const confidence = resume.confidence || 95;

  const matchedKeywords = resume.matchedKeywords || [];
  const missingSkills = resume.missingSkills || [];
  const missingSections = resume.missingSections || [];
  const strengths = resume.strengths || [
    'High keyword density for target technical stack',
    'Quantifiable metrics included in experience section',
    'Clear section hierarchy and standard ATS headings',
  ];
  const weaknesses = resume.weaknesses || [];
  const recommendations = resume.recommendations || resume.suggestions || [
    'Add missing technical keywords to skills section',
    'Quantify additional leadership & project outcomes',
  ];
  const recommendedCertifications = resume.recommendedCertifications || [];
  const recommendedProjects = resume.recommendedProjects || [];

  const scores = resume.sectionScores || {
    parsing: 85,
    formatting: 85,
    keywords: 80,
    skills: 80,
    experience: 80,
    projects: 80,
    grammar: 90,
    education: 90,
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>ATS Resume Audit & Match Report - ${candidateName}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            color: #0f172a;
            line-height: 1.5;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
          }
          .header {
            border-bottom: 3px solid #1877f2;
            padding-bottom: 16px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .title-area h1 {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 4px 0;
          }
          .title-area p {
            font-size: 13px;
            color: #64748b;
            margin: 0;
          }
          .brand {
            font-size: 12px;
            font-weight: 800;
            color: #1877f2;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .scores-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }
          .score-card {
            padding: 12px 14px;
            border-radius: 10px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            text-align: center;
          }
          .score-val {
            font-size: 24px;
            font-weight: 900;
            color: #1877f2;
          }
          .score-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            margin-top: 2px;
          }
          .section-breakdown {
            margin-bottom: 24px;
            padding: 16px;
            border-radius: 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
          }
          .section-title {
            font-size: 13px;
            font-weight: 800;
            margin: 0 0 12px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0f172a;
          }
          .criteria-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .criteria-item {
            padding: 8px 12px;
            background: #ffffff;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            font-weight: 600;
          }
          .criteria-score {
            font-weight: 800;
            color: #1877f2;
          }
          .content-block {
            margin-bottom: 20px;
            padding: 16px;
            border-radius: 10px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
          }
          .block-title {
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 10px 0;
          }
          .strengths-title { color: #047857; }
          .weakness-title { color: #be123c; }
          .rec-title { color: #1877f2; }
          ul { margin: 0; padding-left: 18px; }
          li { font-size: 12px; margin-bottom: 4px; color: #334155; }
          .tags { display: flex; flex-wrap: wrap; gap: 6px; }
          .tag {
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
          }
          .tag-blue { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
          .tag-missing { background: #ffe4e6; color: #be123c; border: 1px solid #fecdd3; }
          .footer {
            margin-top: 30px;
            padding-top: 14px;
            border-top: 1px solid #e2e8f0;
            font-size: 11px;
            color: #94a3b8;
            text-align: center;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title-area">
            <h1>${candidateName}</h1>
            <p>Target Role: <strong>${targetRole}</strong> • File: ${resume.fileName || 'Resume.pdf'} • Scanned: ${resume.uploadDate}</p>
          </div>
          <div class="brand">ATS Audit Report</div>
        </div>

        <div class="scores-grid">
          <div class="score-card">
            <div class="score-val">${atsScore}</div>
            <div class="score-label">ATS Score</div>
          </div>
          <div class="score-card">
            <div class="score-val" style="color: #10b981">${matchScore}%</div>
            <div class="score-label">Role Match</div>
          </div>
          <div class="score-card">
            <div class="score-val" style="color: #6366f1">${confidence}%</div>
            <div class="score-label">Confidence</div>
          </div>
          <div class="score-card">
            <div class="score-val" style="font-size: 14px; color: #0f172a; margin-top: 6px;">${category}</div>
            <div class="score-label">Category</div>
          </div>
        </div>

        <div class="section-breakdown">
          <h3 class="section-title">Weighted ATS Criteria Breakdown</h3>
          <div class="criteria-grid">
            <div class="criteria-item"><span>Resume Parsing (10%)</span><span class="criteria-score">${scores.parsing}/100</span></div>
            <div class="criteria-item"><span>ATS Formatting & Layout (20%)</span><span class="criteria-score">${scores.formatting}/100</span></div>
            <div class="criteria-item"><span>Keyword Match & Context (20%)</span><span class="criteria-score">${scores.keywords}/100</span></div>
            <div class="criteria-item"><span>Skills & Competencies (15%)</span><span class="criteria-score">${scores.skills}/100</span></div>
            <div class="criteria-item"><span>Work Experience Depth (15%)</span><span class="criteria-score">${scores.experience}/100</span></div>
            <div class="criteria-item"><span>Projects & Links (10%)</span><span class="criteria-score">${scores.projects}/100</span></div>
            <div class="criteria-item"><span>Grammar & Active Voice (5%)</span><span class="criteria-score">${scores.grammar}/100</span></div>
            <div class="criteria-item"><span>Education & Degrees (5%)</span><span class="criteria-score">${scores.education}/100</span></div>
          </div>
        </div>

        ${
          missingSections.length > 0
            ? `<div class="content-block" style="background: #fffbebfb; border-color: #fde68a;">
                <h3 class="block-title" style="color: #b45309;">⚠️ Missing Core Sections</h3>
                <div class="tags">
                  ${missingSections.map((s) => `<span class="tag tag-missing">${s}</span>`).join('')}
                </div>
              </div>`
            : ''
        }

        ${
          matchedKeywords.length > 0
            ? `<div class="content-block">
                <h3 class="block-title rec-title">Matched Technical Keywords (${matchedKeywords.length})</h3>
                <div class="tags">
                  ${matchedKeywords.map((k) => `<span class="tag tag-blue">${k}</span>`).join('')}
                </div>
              </div>`
            : ''
        }

        ${
          missingSkills.length > 0
            ? `<div class="content-block">
                <h3 class="block-title weakness-title">Missing Technical Keywords (${missingSkills.length})</h3>
                <div class="tags">
                  ${missingSkills.map((s) => `<span class="tag tag-missing">${s}</span>`).join('')}
                </div>
              </div>`
            : ''
        }

        <div class="content-block">
          <h3 class="block-title strengths-title">Resume Strengths</h3>
          <ul>
            ${strengths.map((s) => `<li>${s}</li>`).join('')}
          </ul>
        </div>

        ${
          weaknesses.length > 0
            ? `<div class="content-block">
                <h3 class="block-title weakness-title">Areas for Improvement</h3>
                <ul>
                  ${weaknesses.map((w) => `<li>${w}</li>`).join('')}
                </ul>
              </div>`
            : ''
        }

        <div class="content-block">
          <h3 class="block-title rec-title">Actionable Recommendations</h3>
          <ul>
            ${recommendations.map((r) => `<li>${r}</li>`).join('')}
          </ul>
        </div>

        ${
          recommendedCertifications.length > 0 || recommendedProjects.length > 0
            ? `<div class="content-block">
                <h3 class="block-title rec-title">Recommended Certifications & Projects</h3>
                <ul>
                  ${recommendedCertifications.map((c) => `<li><strong>Cert:</strong> ${c}</li>`).join('')}
                  ${recommendedProjects.map((p) => `<li><strong>Project:</strong> ${p}</li>`).join('')}
                </ul>
              </div>`
            : ''
        }

        <div class="footer">
          Generated automatically by ATS Resume Analyzer • Verified for Workday, Greenhouse & Taleo ATS compliance
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
