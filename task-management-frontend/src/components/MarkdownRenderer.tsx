import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import styles from './TaskCard.module.css'; // Reusing or new styles? 
// Better to not couple with TaskCard styles directly if reusable.
// But for now, let's just return a div.

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
    return (
        <div className={className}>
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;
