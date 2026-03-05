"""
Resume Parser Module
Handles extraction of text from PDF and DOCX files
"""

import os
import PyPDF2
from docx import Document
import re


class ResumeParser:
    """Parse resumes from PDF and DOCX files"""
    
    def extract_text(self, filepath):
        """
        Extract text from resume file
        
        Args:
            filepath: Path to the resume file
            
        Returns:
            Extracted text as string
        """
        file_ext = filepath.rsplit('.', 1)[1].lower()
        
        if file_ext == 'pdf':
            return self._extract_from_pdf(filepath)
        elif file_ext in ['docx', 'doc']:
            return self._extract_from_docx(filepath)
        else:
            raise ValueError(f"Unsupported file format: {file_ext}")
    
    def _extract_from_pdf(self, filepath):
        """Extract text from PDF file"""
        text = ""
        try:
            with open(filepath, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
        except Exception as e:
            raise Exception(f"Error reading PDF: {str(e)}")
        
        return self._clean_text(text)
    
    def _extract_from_docx(self, filepath):
        """Extract text from DOCX file"""
        try:
            doc = Document(filepath)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        except Exception as e:
            raise Exception(f"Error reading DOCX: {str(e)}")
        
        return self._clean_text(text)
    
    def _clean_text(self, text):
        """
        Basic text cleaning
        Remove excessive whitespace and normalize
        """
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove special characters but keep punctuation
        text = re.sub(r'[^\w\s\.\,\;\:\!\?\-\(\)]', ' ', text)
        # Normalize whitespace
        text = ' '.join(text.split())
        
        return text.strip()
