"""
Job Matcher Module
Matches resume against job description using TF-IDF and cosine similarity
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
from collections import Counter


class JobMatcher:
    """Match resume content against job descriptions"""
    
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            max_features=5000,
            stop_words='english',
            ngram_range=(1, 2),  # Include unigrams and bigrams
            min_df=1,
            max_df=0.95
        )
    
    def match(self, resume_text, job_description):
        """
        Match resume against job description
        
        Args:
            resume_text: Resume content
            job_description: Job description text
            
        Returns:
            Dictionary with match percentage, missing skills, and recommendations
        """
        # Clean and preprocess texts
        resume_clean = self._preprocess_text(resume_text)
        job_clean = self._preprocess_text(job_description)
        
        # Calculate similarity using TF-IDF and cosine similarity
        similarity_score = self._calculate_similarity(resume_clean, job_clean)
        match_percentage = round(similarity_score * 100, 2)
        
        # Extract skills from job description
        job_skills = self._extract_skills_from_job(job_description)
        resume_skills = self._extract_skills_from_resume(resume_text)
        
        # Find missing skills
        missing_skills = self._find_missing_skills(job_skills, resume_skills)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            match_percentage, missing_skills, resume_clean, job_clean
        )
        
        return {
            'match_percentage': match_percentage,
            'similarity_score': round(similarity_score, 4),
            'job_skills': job_skills[:20],  # Top 20 skills
            'resume_skills': resume_skills[:20],
            'missing_skills': missing_skills,
            'recommendations': recommendations
        }
    
    def _preprocess_text(self, text):
        """Preprocess text for better matching"""
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters but keep spaces
        text = re.sub(r'[^\w\s]', ' ', text)
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        return text
    
    def _calculate_similarity(self, resume_text, job_text):
        """Calculate cosine similarity between resume and job description"""
        try:
            # Fit and transform both texts
            tfidf_matrix = self.vectorizer.fit_transform([resume_text, job_text])
            
            # Calculate cosine similarity
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            
            return float(similarity)
        except Exception as e:
            # Fallback to simple word overlap if TF-IDF fails
            return self._simple_similarity(resume_text, job_text)
    
    def _simple_similarity(self, resume_text, job_text):
        """Fallback similarity calculation using word overlap"""
        resume_words = set(resume_text.split())
        job_words = set(job_text.split())
        
        if not job_words:
            return 0.0
        
        intersection = resume_words.intersection(job_words)
        union = resume_words.union(job_words)
        
        if not union:
            return 0.0
        
        return len(intersection) / len(union)
    
    def _extract_skills_from_job(self, job_description):
        """Extract skills mentioned in job description"""
        job_lower = job_description.lower()
        
        # Common technical skills
        common_skills = [
            'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'ruby', 'go', 'rust',
            'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring',
            'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'ci/cd',
            'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn',
            'html', 'css', 'bootstrap', 'sass', 'less',
            'agile', 'scrum', 'devops', 'microservices', 'rest api', 'graphql',
            'linux', 'unix', 'bash', 'shell scripting',
            'data structures', 'algorithms', 'oop', 'design patterns',
            'project management', 'leadership', 'communication', 'teamwork'
        ]
        
        found_skills = []
        for skill in common_skills:
            if skill in job_lower:
                found_skills.append(skill.title())
        
        # Look for skill requirements section
        skill_patterns = [
            r'(?:required|must have|skills?|qualifications?)[:\s]+(.*?)(?:\n\n|requirements|responsibilities|$)',
            r'(?:proficient|experience|knowledge) in ([^\.]+)',
        ]
        
        for pattern in skill_patterns:
            matches = re.findall(pattern, job_lower, re.IGNORECASE | re.DOTALL)
            for match in matches:
                # Extract skills from the match
                skills = re.split(r'[,;•\n]', match)
                for skill in skills:
                    skill = skill.strip()
                    if len(skill) > 2 and len(skill) < 50:
                        found_skills.append(skill.title())
        
        return list(set(found_skills))
    
    def _extract_skills_from_resume(self, resume_text):
        """Extract skills from resume"""
        resume_lower = resume_text.lower()
        
        common_skills = [
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
        
        found_skills = []
        for skill in common_skills:
            if skill in resume_lower:
                found_skills.append(skill.title())
        
        return list(set(found_skills))
    
    def _find_missing_skills(self, job_skills, resume_skills):
        """Find skills required by job but missing in resume"""
        job_skills_lower = [s.lower() for s in job_skills]
        resume_skills_lower = [s.lower() for s in resume_skills]
        
        missing = []
        for job_skill in job_skills_lower:
            # Check if skill is in resume (exact or partial match)
            found = False
            for resume_skill in resume_skills_lower:
                if job_skill in resume_skill or resume_skill in job_skill:
                    found = True
                    break
            
            if not found:
                missing.append(job_skill.title())
        
        return missing[:15]  # Return top 15 missing skills
    
    def _generate_recommendations(self, match_percentage, missing_skills, resume_text, job_text):
        """Generate improvement recommendations"""
        recommendations = []
        
        if match_percentage < 50:
            recommendations.append("Your resume has a low match percentage. Consider tailoring it more closely to the job description.")
        
        if missing_skills:
            recommendations.append(f"Add these missing skills to your resume: {', '.join(missing_skills[:5])}")
        
        # Check for keywords
        job_words = set(job_text.split())
        resume_words = set(resume_text.split())
        missing_keywords = job_words - resume_words
        
        if len(missing_keywords) > 10:
            recommendations.append("Consider incorporating more keywords from the job description into your resume.")
        
        # Check resume length
        resume_word_count = len(resume_text.split())
        if resume_word_count < 200:
            recommendations.append("Your resume seems too short. Consider adding more details about your experience and achievements.")
        elif resume_word_count > 1000:
            recommendations.append("Your resume might be too long. Consider condensing it to highlight the most relevant experience.")
        
        if not recommendations:
            recommendations.append("Your resume looks well-matched! Continue highlighting relevant experience and achievements.")
        
        return recommendations
