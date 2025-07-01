import { useRef, useEffect, useState, useCallback } from 'react';
import { SongsData, SongItem } from '@/types/songs';

interface LyricsViewProps {
  songs: SongsData;
  songItems: SongItem[];
  selectedTitle: string;
  onUpdateTitle: (oldTitle: string, newTitle: string) => Promise<void>;
  onUpdateLyrics: (title: string, newLyrics: string) => Promise<void>;
  masterFontSize: number;
  showLeftPane: boolean;
  onVisibleSongChange: (title: string) => void;
}

export default function LyricsView({ 
  songs, 
  songItems, 
  selectedTitle,
  onUpdateTitle,
  onUpdateLyrics,
  masterFontSize,
  showLeftPane,
  onVisibleSongChange
}: LyricsViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editingLyrics, setEditingLyrics] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [tempLyrics, setTempLyrics] = useState('');

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const viewportTop = containerRect.top;
    const viewportBottom = containerRect.bottom;

    // Get all visible song elements
    const visibleSongs = songItems
      .filter(item => !item.hidden)
      .map(item => ({
        title: item.title,
        element: document.getElementById(`song-${item.title}`)
      }))
      .filter(item => item.element);

    // Find the first song that's visible in the viewport
    for (const { title, element } of visibleSongs) {
      if (!element) continue;
      const rect = element.getBoundingClientRect();
      
      // Check if any part of the song is visible in the viewport
      if (rect.bottom > viewportTop && rect.top < viewportBottom) {
        onVisibleSongChange(title);
        break;
      }
    }
  }, [songItems, onVisibleSongChange]);

  useEffect(() => {
    if (selectedTitle && containerRef.current) {
      const element = document.getElementById(`song-${selectedTitle}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [selectedTitle]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Add scroll event listener
    container.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  const handleTitleEdit = useCallback((title: string) => {
    setEditingTitle(title);
    setTempTitle(title);
    setEditingLyrics(title);
    setTempLyrics(songs[title]);
  }, [songs]);

  const handleLyricsEdit = useCallback((title: string) => {
    setEditingLyrics(title);
    setTempLyrics(songs[title]);
  }, [songs]);

  const handleTitleSave = useCallback(async (oldTitle: string) => {
    if (tempTitle.trim() && tempTitle !== oldTitle) {
      await onUpdateTitle(oldTitle, tempTitle.trim());
    }
    setEditingTitle(null);
  }, [tempTitle, onUpdateTitle]);

  const handleLyricsSave = useCallback(async (title: string) => {
    if (tempLyrics.trim() && tempLyrics !== songs[title]) {
      await onUpdateLyrics(title, tempLyrics.trim());
    }
    setEditingLyrics(null);
  }, [tempLyrics, songs, onUpdateLyrics]);

  const handleKeyDown = useCallback((
    e: React.KeyboardEvent,
    saveHandler: () => void,
    cancelHandler: () => void
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveHandler();
    } else if (e.key === 'Escape') {
      cancelHandler();
    }
  }, []);

  // Filter out hidden songs
  const visibleSongs = songItems.filter(item => !item.hidden);

  return (
    <div ref={containerRef} className={`h-full overflow-y-auto p-6 bg-white ${!showLeftPane ? 'flex flex-col items-center' : ''}`}>
      {visibleSongs.map((item) => (
        <div
          key={item.title}
          id={`song-${item.title}`}
          className={`mb-12 ${!showLeftPane ? 'max-w-3xl w-full' : ''}`}
        >
          <div className="border-b border-gray-200 mb-4 flex items-center justify-between">
            {editingTitle === item.title ? (
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={() => handleTitleSave(item.title)}
                onKeyDown={(e) => handleKeyDown(
                  e,
                  () => handleTitleSave(item.title),
                  () => {
                    setEditingTitle(null);
                    setTempTitle(item.title);
                  }
                )}
                className="text-2xl font-bold py-1 px-2 w-full focus:outline-none focus:border-b-2 focus:border-blue-500"
                style={{ fontSize: `${masterFontSize + 8}px` }}
                autoFocus={editingLyrics !== item.title}
              />
            ) : (
              <div className={`flex items-center justify-between w-full ${!showLeftPane ? 'max-w-3xl mx-auto' : ''}`}>
                <h2 
                  className={`text-2xl font-bold ${!showLeftPane ? 'flex-1 text-center' : ''}`}
                  style={{ fontSize: `${masterFontSize + 8}px` }}
                >
                  {item.title}
                </h2>
                <button
                  onClick={() => handleTitleEdit(item.title)}
                  className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                  title="Edit Title and Lyrics"
                >
                  ✎
                </button>
              </div>
            )}
          </div>

          <div>
            {editingLyrics === item.title ? (
              <div>
                <textarea
                  value={tempLyrics}
                  onChange={(e) => setTempLyrics(e.target.value)}
                  onBlur={() => handleLyricsSave(item.title)}
                  className="whitespace-pre-wrap font-sans leading-relaxed w-full min-h-[200px] p-2 focus:outline-none focus:border focus:border-blue-500 rounded"
                  style={{ fontSize: `${masterFontSize}px` }}
                  autoFocus={editingTitle === item.title}
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => {
                      setEditingLyrics(null);
                      setTempLyrics(songs[item.title]);
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Cancel"
                  >
                    ✕
                  </button>
                  <button
                    onClick={() => handleLyricsSave(item.title)}
                    className="p-1 text-gray-400 hover:text-green-500 transition-colors"
                    title="Save"
                  >
                    ✓
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative group">
                <div 
                  className={`whitespace-pre-wrap font-sans leading-relaxed ${!showLeftPane ? 'text-center' : ''}`}
                  style={{ fontSize: `${masterFontSize}px` }}
                >
                  {songs[item.title]}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 