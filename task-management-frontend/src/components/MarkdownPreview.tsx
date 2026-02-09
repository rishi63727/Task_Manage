import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownPreviewProps {
  content: string;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content }) => (
  <div className="markdown">
    <ReactMarkdown>{content || '_No content provided._'}</ReactMarkdown>
  </div>
);

export default MarkdownPreview;
