'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { UserIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
  email: string | null;
  avatar: string | null;
  role: string;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  users: User[];
  courseId?: string;
}

export default function MentionTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  className = '',
  users,
  courseId,
}: MentionTextareaProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Add @all option
  const allOption = { id: '@all', name: 'all', email: null, avatar: null, role: 'all' };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    onChange(newValue);

    // Find @ mention
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      // Check if there's a space after @ (meaning mention ended)
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      const hasSpace = textAfterAt.includes(' ') || textAfterAt.includes('\n');
      
      if (!hasSpace) {
        const query = textAfterAt.toLowerCase();
        setMentionStart(lastAtIndex);
        setMentionQuery(query);
        
        // Filter users based on query
        let filteredUsers: User[] = [];
        
        // Always show @all option when query starts with 'a' or is empty
        if (query === '' || query === 'a' || query.startsWith('al')) {
          filteredUsers.push(allOption as User);
        }
        
        // Filter users by name
        if (query === '') {
          // Show all users when query is empty (just typed @)
          filteredUsers = [...filteredUsers, ...users].slice(0, 9); // 9 users + @all = 10 total
        } else if (query === 'a' || query.startsWith('al')) {
          // When typing 'a' or 'al', show @all first, then users matching 'a'
          const matchingUsers = users.filter(user => 
            user.name.toLowerCase().includes(query)
          );
          filteredUsers = [...filteredUsers, ...matchingUsers].slice(0, 9);
        } else {
          // Filter users by name matching query
          const matchingUsers = users.filter(user => 
            user.name.toLowerCase().includes(query)
          );
          filteredUsers = [...filteredUsers, ...matchingUsers].slice(0, 10);
        }
        
        setSuggestions(filteredUsers);
        setShowSuggestions(filteredUsers.length > 0 && users.length > 0);
        setSelectedIndex(0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const insertMention = useCallback((mention: string) => {
    if (mentionStart === null || !textareaRef.current) return;
    
    const textBefore = value.substring(0, mentionStart);
    const textAfter = value.substring(textareaRef.current.selectionStart);
    const newValue = `${textBefore}@${mention} ${textAfter}`;
    
    onChange(newValue);
    setShowSuggestions(false);
    setMentionStart(null);
    setMentionQuery('');
    
    // Focus back to textarea and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionStart + mention.length + 2; // +2 for @ and space
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }, [value, mentionStart, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (suggestions[selectedIndex]) {
        const mention = suggestions[selectedIndex].id === '@all' 
          ? 'all' 
          : suggestions[selectedIndex].name;
        insertMention(mention);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate dropdown position
  const getDropdownPosition = () => {
    if (!textareaRef.current || mentionStart === null) return { top: '0px', left: '0px' };
    
    const textarea = textareaRef.current;
    const textBeforeCursor = value.substring(0, mentionStart);
    
    // Create a temporary span to measure text width
    const span = document.createElement('span');
    span.style.visibility = 'hidden';
    span.style.position = 'absolute';
    span.style.whiteSpace = 'pre-wrap';
    span.style.font = window.getComputedStyle(textarea).font;
    span.style.padding = window.getComputedStyle(textarea).padding;
    span.textContent = textBeforeCursor;
    document.body.appendChild(span);
    
    const rect = textarea.getBoundingClientRect();
    const textWidth = span.offsetWidth;
    const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight) || 20;
    
    // Calculate which line we're on
    const textBeforeCursorLines = textBeforeCursor.split('\n');
    const currentLine = textBeforeCursorLines.length - 1;
    const lineOffset = currentLine * lineHeight;
    
    document.body.removeChild(span);
    
    return {
      top: `${lineOffset + lineHeight + 5}px`,
      left: `${textWidth + 16}px`, // Add padding
      position: 'absolute' as const,
    };
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={className}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto min-w-[250px]"
          style={getDropdownPosition()}
        >
          {suggestions.map((user, index) => (
            <div
              key={user.id}
              onClick={() => {
                const mention = user.id === '@all' ? 'all' : user.name;
                insertMention(mention);
              }}
              className={`px-4 py-2 cursor-pointer flex items-center space-x-2 hover:bg-blue-50 ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
            >
              {user.id === '@all' ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-xs">@</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">@all</div>
                    <div className="text-xs text-gray-500">Tag ทุกคนในหลักสูตร</div>
                  </div>
                </>
              ) : (
                <>
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      user.role === 'TEACHER' ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      {user.role === 'TEACHER' ? (
                        <AcademicCapIcon className="h-5 w-5 text-purple-600" />
                      ) : (
                        <UserIcon className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    {user.email && (
                      <div className="text-xs text-gray-500">{user.email}</div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
