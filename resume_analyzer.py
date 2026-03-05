"""
Resume Analyzer Module
Analyzes resume content to extract skills, experience, education, etc.
"""

import re
from collections import Counter
from datetime import datetime


class ResumeAnalyzer:
    """Analyze resume content and extract structured information"""
    
    # Common technical skills keywords
    TECHNICAL_SKILLS = [
        'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'ruby', 'go', 'rust',
        'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring',
        'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'ci/cd',
        'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn',
        'html', 'css', 'bootstrap', 'sass', 'less',
        'agile', 'scrum', 'devops', 'microservices', 'rest api', 'graphql',
        'linux', 'unix', 'bash', 'shell scripting',
        'data structures', 'algorithms', 'oop', 'design patterns'
    ]
    
    # Education keywords
    EDUCATION_KEYWORDS = [
        'bachelor', 'master', 'phd', 'doctorate', 'degree', 'diploma',
        'university', 'college', 'institute', 'school',
        'bs', 'ba', 'ms', 'ma', 'mba', 'phd'
    ]
    
    def analyze(self, resume_text):
        """
        Analyze resume and extract key information
        
        Args:
            resume_text: Raw text from resume
            
        Returns:
            Dictionary with analysis results
        """
        resume_lower = resume_text.lower()
        
        # Extract skills
        skills = self._extract_skills(resume_lower)
        
        # Extract experience
        experience = self._extract_experience(resume_text)
        
        # Extract education
        education = self._extract_education(resume_text, resume_lower)
        
        # Extract contact info
        contact_info = self._extract_contact_info(resume_text)
        
        # Calculate statistics
        word_count = len(resume_text.split())
        char_count = len(resume_text)
        
        return {
            'skills': skills,
            'experience': experience,
            'education': education,
            'contact_info': contact_info,
            'statistics': {
                'word_count': word_count,
                'char_count': char_count,
                'skills_count': len(skills)
            }
        }
    
    def _extract_skills(self, resume_lower):
        """Extract technical skills from resume"""
        found_skills = []
        
        for skill in self.TECHNICAL_SKILLS:
            # Check for skill mentions (word boundaries)
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, resume_lower):
                found_skills.append(skill.title())
        
        # Also look for common skill section patterns
        skill_sections = re.findall(
            r'(?:skills?|technical skills?|technologies?|tools?)[:\s]+([^\.]+)',
            resume_lower,
            re.IGNORECASE
        )
        
        for section in skill_sections:
            # Extract individual skills from comma/pipe/semicolon separated lists
            items = re.split(r'[,|;]', section)
            for item in items:
                item = item.strip()
                if len(item) > 2 and len(item) < 30:
                    found_skills.append(item.title())
        
        # Remove duplicates and return
        return list(set(found_skills))
    
    def _extract_experience(self, resume_text):
        """Extract work experience information"""
        experience = []
        
        # Look for experience section
        exp_patterns = [
            r'(?:experience|work experience|employment|professional experience)',
            r'(?:intern|internship)',
            r'(?:position|role|job)'
        ]
        
        # Try to find dates (years)
        year_pattern = r'\b(19|20)\d{2}\b'
        years = re.findall(year_pattern, resume_text)
        
        # Look for company names (usually capitalized words)
        company_pattern = r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Inc|LLC|Corp|Ltd|Company|Technologies|Systems)'
        companies = re.findall(company_pattern, resume_text)
        
        # Look for job titles
        title_keywords = ['engineer', 'developer', 'manager', 'analyst', 'specialist', 
                         'consultant', 'lead', 'senior', 'junior', 'intern']
        titles = []
        for keyword in title_keywords:
            pattern = r'\b(?:senior|junior|lead|principal)?\s*\w*\s*' + keyword + r'\b'
            matches = re.findall(pattern, resume_text, re.IGNORECASE)
            titles.extend(matches)
        
        return {
            'years_mentioned': list(set(years)),
            'companies_found': list(set(companies))[:5],  # Limit to 5
            'titles_found': list(set(titles))[:5],
            'experience_years': self._estimate_experience_years(years)
        }
    
    def _extract_education(self, resume_text, resume_lower):
        """Extract education information"""
        education = []
        
        # Look for education section
        edu_section = re.search(
            r'(?:education|academic|qualifications?)[:\s]+(.*?)(?:\n\n|\n[A-Z]|$)',
            resume_lower,
            re.IGNORECASE | re.DOTALL
        )
        
        if edu_section:
            edu_text = edu_section.group(1)
            
            # Look for degree types
            degrees = []
            for degree in ['bachelor', 'master', 'phd', 'doctorate', 'mba', 'bs', 'ba', 'ms', 'ma']:
                if degree in edu_text:
                    degrees.append(degree.title())
            
            # Look for universities/colleges
            uni_pattern = r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:University|College|Institute|School)'
            universities = re.findall(uni_pattern, resume_text)
            
            education = {
                'degrees': list(set(degrees)),
                'institutions': list(set(universities))[:3]
            }
        
        return education if education else {'degrees': [], 'institutions': []}
    
    def _extract_contact_info(self, resume_text):
        """Extract contact information"""
        contact = {}
        
        # Email
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, resume_text)
        if emails:
            contact['email'] = emails[0]
        
        # Phone (various formats)
        phone_patterns = [
            r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
            r'\(\d{3}\)\s?\d{3}[-.]?\d{4}',
            r'\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}'
        ]
        for pattern in phone_patterns:
            phones = re.findall(pattern, resume_text)
            if phones:
                contact['phone'] = phones[0]
                break
        
        # LinkedIn
        linkedin_pattern = r'(?:linkedin\.com/in/|linkedin\.com/pub/)([\w-]+)'
        linkedin = re.search(linkedin_pattern, resume_text, re.IGNORECASE)
        if linkedin:
            contact['linkedin'] = linkedin.group(0)
        
        return contact
    
    def _estimate_experience_years(self, years):
        """Estimate years of experience from mentioned years"""
        if not years:
            return 0
        
        try:
            years_int = [int(y) for y in years if len(y) == 4]
            if years_int:
                current_year = datetime.now().year
                oldest_year = min(years_int)
                return max(0, current_year - oldest_year)
        except:
            pass
        
        return 0
