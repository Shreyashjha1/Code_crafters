"""
AI Chat Assistant Module
Handles AI chat responses using OpenAI API with resume context
"""

import os
from openai import OpenAI


class AIChatAssistant:
    """AI chat assistant that understands resume context"""
    
    def __init__(self):
        # Initialize OpenAI client
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            # For development, you can set a placeholder
            # In production, ensure OPENAI_API_KEY is set
            print("Warning: OPENAI_API_KEY not found. Chat functionality will be limited.")
            self.client = None
        else:
            self.client = OpenAI(api_key=api_key)
        
        # System prompt for resume analysis
        self.system_prompt = """You are an expert resume advisor and career counselor. 
Your role is to help users improve their resumes based on the resume content they've uploaded.

When answering questions:
1. Be specific and actionable
2. Reference specific parts of their resume when relevant
3. Provide concrete examples and suggestions
4. Be encouraging but honest
5. Focus on practical improvements

Always maintain context about the user's resume and provide personalized advice."""
    
    def get_response(self, user_message, resume_text):
        """
        Get AI response based on user message and resume context
        
        Args:
            user_message: User's question/message
            resume_text: The uploaded resume text
            
        Returns:
            AI response string
        """
        if not self.client:
            # Fallback response if OpenAI API is not configured
            return self._get_fallback_response(user_message, resume_text)
        
        try:
            # Prepare messages with resume context
            messages = [
                {
                    "role": "system",
                    "content": self.system_prompt + f"\n\nUser's Resume Content:\n{resume_text[:3000]}"  # Limit context size
                },
                {
                    "role": "user",
                    "content": user_message
                }
            ]
            
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",  # Can be changed to gpt-4 for better results
                messages=messages,
                max_tokens=500,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
        
        except Exception as e:
            # Return error message or fallback
            return f"I apologize, but I encountered an error: {str(e)}. Please try again or check your OpenAI API configuration."
    
    def _get_fallback_response(self, user_message, resume_text):
        """Fallback response when OpenAI API is not available"""
        user_lower = user_message.lower()
        
        # Simple rule-based responses
        if 'skill' in user_lower and ('missing' in user_lower or 'lack' in user_lower):
            return """To identify missing skills, I recommend:
1. Review the job description for required skills
2. Compare them with your resume
3. Use the "Match Job" feature to see missing skills
4. Add relevant skills you have but haven't mentioned

Would you like me to analyze a specific job description for you?"""
        
        elif 'improve' in user_lower or 'better' in user_lower:
            return """Here are some general tips to improve your resume:
1. Use action verbs (developed, implemented, led, etc.)
2. Quantify achievements with numbers and metrics
3. Tailor your resume to each job application
4. Highlight relevant skills and experience
5. Keep formatting clean and consistent
6. Proofread for grammar and spelling errors

For personalized advice, please set up the OpenAI API key in your environment variables."""
        
        elif 'experience' in user_lower:
            return """To improve your experience section:
1. Focus on achievements, not just responsibilities
2. Use the STAR method (Situation, Task, Action, Result)
3. Include metrics and quantifiable results
4. Highlight relevant experience for the target role
5. Use industry-specific keywords

Would you like specific advice based on your resume? Please configure the OpenAI API key for detailed analysis."""
        
        else:
            return """I'm here to help you improve your resume! 

To get the best advice, please:
1. Set up your OpenAI API key (set OPENAI_API_KEY environment variable)
2. Ask specific questions like:
   - "What skills are missing in my resume?"
   - "How can I improve my resume for a software engineer role?"
   - "What should I highlight in my experience section?"

For now, you can use the resume analysis and job matching features to get insights about your resume."""
