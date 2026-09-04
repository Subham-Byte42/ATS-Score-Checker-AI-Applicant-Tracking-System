# 🤖 AI Resume Analyzer

### An AI-powered web application for analyzing, improving, and comparing resumes

[🌐 Live Demo](https://ats-score-checker-615076846565.asia-southeast1.run.app) • [💻 GitHub](https://github.com/Subham-Byte42) • [👤 LinkedIn](https://www.linkedin.com/in/subham-meher-147b34385/)

---

## 📌 About The Project

**AI Resume Analyzer** is a web-based project developed to make the process of resume analysis easier for both **job seekers and recruiters**.

Creating a good resume is important when applying for jobs, but many candidates do not know whether their resume contains the right skills, keywords, experience, and information required for a particular job. At the same time, recruiters often have to go through a large number of resumes when hiring candidates.

This project aims to solve these problems using **Artificial Intelligence and data visualization**.

The application has two main sections:

- 👤 **Personal Portal** – For candidates to analyze and improve their own resumes.
- 🧑‍💼 **Recruiter Portal** – For recruiters to analyze, compare, and rank multiple candidates.

The project uses AI to extract useful information from resumes and presents the results through **scores, charts, comparisons, and suggestions**, making the information easier to understand.

---

## 🔗 Project Links

| Link | Description |
|---|---|
| 🌐 **Live Demo** | Try the deployed application |
| 💻 **GitHub Repository** | View the source code and development |
| 👤 **LinkedIn** | Connect with me and see my other projects |

**Live Demo:** [AI-Resume-Analyzer](https://ats-score-checker-615076846565.asia-southeast1.run.app)

**GitHub:** [Github](https://github.com/Subham-Byte42)

**LinkedIn:** [LINKEDIN](https://www.linkedin.com/in/subham-meher-147b34385/)

---

# 🎯 Project Objective

The main objective of this project is to build a simple platform that can help users understand the quality and relevance of a resume.

For a **job seeker**, the application helps answer questions such as:

- How good is my resume?
- What is my ATS score?
- Which skills are present in my resume?
- Which important keywords are missing?
- What areas of my resume need improvement?
- How well does my resume match a particular job?

For a **recruiter**, the application helps answer questions such as:

- Which candidate is the best fit for a job?
- How do multiple candidates compare?
- Which candidate has better skills or experience?
- How closely does each resume match the job description?
- Which candidates should be shortlisted?

---

# ✨ Main Features

## 👤 1. Personal Portal

The Personal Portal is designed for users who want to analyze and improve their own resumes.

### 📄 Resume Upload

Users can upload their resume to the application. The resume is processed and the important information is extracted for analysis.

The system can analyze information such as:

- Name and contact information
- Skills
- Education
- Work experience
- Projects
- Certifications
- Keywords
- Resume sections

### 📊 ATS Score

After analyzing the resume, the application provides an **ATS-style score**.

The score gives the user an idea of how well their resume is structured and how relevant it may be for a particular job.

The analysis can consider factors such as:

- Resume formatting
- Relevant keywords
- Skills
- Experience
- Education
- Projects
- Overall relevance

Instead of showing only a single number, the application provides a visual breakdown so that users can understand where their resume performs well and where it needs improvement.

### 🔑 Missing Keywords

The application can identify keywords that are present in a job description but missing from the resume.

For example:

```text
Job Description:
Python
SQL
Machine Learning
Power BI
AWS

Resume:
Python
SQL
Machine Learning

Missing:
Power BI
AWS
```

This helps users understand which relevant skills or keywords they may want to include if they actually possess them.

### 🧠 Skills Analysis

The application identifies the skills mentioned in the resume and presents them visually.

For example:

```text
Programming
    Python
    C++
    Java

Data Science
    Pandas
    NumPy
    Machine Learning

Web Development
    HTML
    CSS
    JavaScript
```

The skills can also be represented using charts to make the information easier to understand.

### 📈 Resume Score Progress

Users can analyze their resume multiple times after making improvements.

The application can display previous scores using a graph so users can visually understand how their resume has improved.

```text
Resume Version 1 → 62%
Resume Version 2 → 71%
Resume Version 3 → 82%
Resume Version 4 → 89%
```

### 💡 Improvement Suggestions

The AI provides suggestions based on the resume analysis.

Examples include:

- Improving the professional summary
- Adding relevant technical skills
- Using stronger action words
- Adding measurable achievements
- Improving project descriptions
- Including relevant keywords
- Removing unnecessary information

The purpose is not just to provide a score, but also to explain **how the resume can be improved**.

---

# 🧑‍💼 2. Recruiter Portal

The Recruiter Portal is designed to help recruiters compare multiple candidates for a particular job.

Instead of manually checking every resume separately, recruiters can upload multiple resumes and analyze them together.

### 📋 Candidate Screening

Recruiters can upload multiple candidate resumes.

The application analyzes information such as:

- Skills
- Education
- Experience
- Projects
- Certifications
- Keywords
- Job relevance

The candidates can then be displayed together in the recruiter dashboard.

### 🎯 Job Description Matching

The recruiter can provide a **Job Description (JD)**.

The application compares the requirements of the job with the information available in each candidate's resume.

```text
Job Description
       ↓
Skills
Experience
Education
Projects
Keywords
       ↓
Candidate Resume
       ↓
AI Analysis
       ↓
Match Score
```

This helps recruiters understand how relevant each candidate is to the job.

### 🏆 Candidate Comparison

One of the main features of the Recruiter Portal is the ability to **compare candidates**.

For example:

| Candidate | Skills | Experience | JD Match | Overall |
|---|---:|---:|---:|---:|
| Candidate A | 85% | 80% | 91% | 87% |
| Candidate B | 78% | 90% | 82% | 83% |
| Candidate C | 92% | 70% | 88% | 84% |

This allows recruiters to view multiple candidates together instead of checking every resume separately.

### 📊 Visual Candidate Analysis

The recruiter dashboard uses charts and visualizations to make candidate comparison easier.

Possible visualizations include:

- Skill comparison
- Experience comparison
- ATS score comparison
- Job match score
- Candidate ranking
- Skill gap analysis

### 🥇 Candidate Ranking

After analyzing the candidates, the application can rank them according to their overall suitability for the job.

```text
1. Candidate A — 91%
2. Candidate C — 87%
3. Candidate B — 82%
4. Candidate D — 76%
```

This helps recruiters quickly identify candidates who may deserve further consideration.

The ranking is intended to support recruiter decision-making rather than completely replace human judgment.

---

# 🤖 AI Integration

Artificial Intelligence is one of the main parts of this project.

The application uses **Google Gemini API** to analyze resume information and generate useful insights.

AI is used for tasks such as:

- Resume understanding
- Skill extraction
- Keyword identification
- Resume evaluation
- Job description comparison
- Improvement suggestions
- Candidate comparison

The AI processes the resume information and returns structured results that can be displayed on the dashboard.

---

# 📊 Data Visualization

Another important part of this project is presenting the analysis visually.

Instead of showing users only text and numbers, the application uses charts and graphical representations.

Some of the information that can be visualized includes:

- ATS score
- Skills
- Experience
- Keywords
- Job match percentage
- Candidate comparison
- Candidate ranking
- Resume improvement progress

This makes the results easier to understand at a glance.

---

# 🔄 How The Application Works

## Personal Portal

```text
User
  ↓
Upload Resume
  ↓
Resume Processing
  ↓
AI Analysis
  ↓
Extract Skills, Experience, Keywords etc.
  ↓
ATS Score
  ↓
Visual Dashboard
  ↓
Improvement Suggestions
```

## Recruiter Portal

```text
Recruiter
    ↓
Add Job Description
    ↓
Upload Multiple Resumes
    ↓
AI Analysis
    ↓
Compare Candidates with JD
    ↓
Generate Scores
    ↓
Visual Comparison
    ↓
Candidate Ranking
```

---

# 🛠️ Technologies Used

### Frontend

- **React.js** – Used to build the user interface.
- **TypeScript** – Used for type-safe development.
- **Tailwind CSS** – Used for styling and responsive design.
- **Vite** – Used as the frontend development and build tool.
- **Recharts** – Used to create charts and visualizations.
- **Lucide React** – Used for icons.
- **Framer Motion** – Used for animations and UI interactions.

### Backend

- **Node.js** – Runtime environment.
- **Express.js** – Used to create backend APIs.
- **Multer** – Used for handling file uploads.
- **PDF parsing libraries** – Used to extract text from PDF resumes.

### Database & Authentication

- **Firebase**
- **Firestore**
- **Firebase Authentication**

### Artificial Intelligence

- **Google Gemini API**

Gemini is used to analyze resumes and generate structured insights and suggestions.

---

# 📁 Project Structure

```text
AI-Resume-Analyzer/
│
├── public/
│
├── src/
│   ├── components/
│   │   ├── personal/
│   │   │   ├── ResumeUpload
│   │   │   ├── ATSScore
│   │   │   ├── SkillsChart
│   │   │   └── ResumeAnalysis
│   │   │
│   │   └── recruiter/
│   │       ├── CandidateList
│   │       ├── CandidateComparison
│   │       ├── CandidateRanking
│   │       └── RecruiterDashboard
│   │
│   ├── pages/
│   ├── server/
│   ├── lib/
│   ├── types/
│   └── App.tsx
│
├── .env.example
├── package.json
├── vite.config.ts
└── README.md
```

---

# 🎓 What I Learned From This Project

As my first major project, this project helped me understand how different technologies work together to build a complete application.

Through this project, I learned about:

- React component development
- TypeScript
- Frontend and backend communication
- REST APIs
- File uploading
- Resume text extraction
- AI API integration
- Firebase and Firestore
- User authentication
- Data visualization
- Dashboard design
- Structured AI responses
- Connecting different parts of a web application

Most importantly, this project helped me understand how an idea can be converted into a working application by combining different technologies.

---

# 🚀 Future Improvements

Some features I would like to add in the future include:

- LinkedIn profile integration
- More detailed ATS analysis
- Resume templates
- AI-based resume improvement
- Automated interview question generation
- Better candidate ranking
- PDF report export
- More advanced recruiter analytics
- Resume version management
- Improved job-description matching

---

# 📌 Project Status

🚧 **In Development**

This project is being developed as a learning and portfolio project. More features and improvements will be added as I continue learning and developing the application.

---

# 🤝 Contributing

This is a learning project, so suggestions and feedback are welcome.

If you find a bug, have an idea for a feature, or want to improve the project, feel free to create an issue or submit a pull request.

---

# 📄 License

This project is licensed under the **MIT License**.

---

# 🔗 Connect With Me

If you found this project interesting, feel free to check out my other work and connect with me.

- 💻 **GitHub:** [Github](https://github.com/Subham-Byte42)
- 👤 **LinkedIn:** [LINKEDIN](https://www.linkedin.com/in/subham-meher-147b34385/)
- 🌐 **Live Project:** [AI-Resume-Analyzer](https://ats-score-checker-615076846565.asia-southeast1.run.app)

---

## ⭐ Project Vision

The goal of this project is to create a simple platform where:

> **Job seekers can understand and improve their resumes, while recruiters can efficiently compare candidates and find suitable talent.**

This project combines **AI, web development, databases, authentication, and data visualization** to solve a practical problem.

### Analyze → Improve → Compare → Make Better Decisions 🚀

---

**Made with ❤️ as a learning project**
