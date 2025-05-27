'use client';

import { useState, useEffect } from 'react';
import { SongsData, SongItem } from '@/types/songs';
import SongList from '@/components/SongList';
import LyricsView from '@/components/LyricsView';

export default function Home() {
  const [songs, setSongs] = useState<SongsData>({});
  const [selectedTitle, setSelectedTitle] = useState<string>('');
  const [songItems, setSongItems] = useState<SongItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongLyrics, setNewSongLyrics] = useState('');
  const [masterFontSize, setMasterFontSize] = useState(16);
  const [showLeftPane, setShowLeftPane] = useState(true);
  const [visibleSongTitle, setVisibleSongTitle] = useState('');

  useEffect(() => {
    // Load songs data and order
    console.log('Loading songs data...');
    Promise.all([
      fetch('/api/songs').then(res => res.json()),
      fetch('/api/songs/order').then(res => res.json())
    ])
      .then(([songsData, orderData]) => {
        console.log('Songs data loaded:', songsData);
        setSongs(songsData);
        
        // If we have saved order, use it; otherwise create default order
        if (orderData && orderData.length > 0) {
          setSongItems(orderData);
        } else {
          setSongItems(Object.keys(songsData).map(title => ({
            title,
            hidden: false
          })));
        }
      })
      .catch(error => {
        console.error('Error loading songs:', error);
        alert('Failed to load songs. Please try refreshing the page.');
      });
  }, []);

  const handleReorder = async (newItems: SongItem[]) => {
    setSongItems(newItems);
    // Save the new order to KV
    try {
      await fetch('/api/songs/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItems),
      });
    } catch (error) {
      console.error('Failed to save song order:', error);
    }
  };

  const toggleHidden = async (title: string) => {
    const updatedItems = songItems.map(item => 
      item.title === title 
        ? { ...item, hidden: !item.hidden }
        : item
    );
    setSongItems(updatedItems);

    // Save the updated order to KV
    try {
      await fetch('/api/songs/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedItems),
      });
    } catch (error) {
      console.error('Failed to save song order:', error);
    }
  };

  const handleDelete = async (title: string) => {
    // Update both states at once to avoid multiple re-renders
    const updatedItems = songItems.filter(item => item.title !== title);
    setSongItems(updatedItems);
    setSongs(prevSongs => {
      const newSongs = { ...prevSongs };
      delete newSongs[title];
      return newSongs;
    });

    // Save to backend
    try {
      await Promise.all([
        fetch('/api/songs', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title }),
        }),
        fetch('/api/songs/order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedItems),
        })
      ]);
    } catch (error) {
      console.error('Failed to delete song:', error);
    }
  };

  const handleAdd = async (title: string, lyrics: string) => {
    // Check for duplicate titles
    if (songs[title]) {
      alert('A song with this title already exists!');
      return;
    }

    const newSong = { title, lyrics };
    const newSongItem = { title, hidden: false };

    // Update both states at once
    setSongs(prev => ({ ...prev, [title]: lyrics }));
    setSongItems(prev => [...prev, newSongItem]);

    // Save to backend
    try {
      console.log('Saving new song:', newSong);
      const response = await fetch('/api/songs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSong),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Save response:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save song');
      }

      // Save the updated order
      const updatedOrder = [...songItems, newSongItem];
      await fetch('/api/songs/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedOrder),
      });
    } catch (error) {
      console.error('Failed to add song:', error);
      alert('Failed to save song. Please try again.');
      // Revert the state changes
      setSongs(prev => {
        const newSongs = { ...prev };
        delete newSongs[title];
        return newSongs;
      });
      setSongItems(prev => prev.filter(item => item.title !== title));
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSongTitle.trim() && newSongLyrics.trim()) {
      handleAdd(newSongTitle.trim(), newSongLyrics.trim());
      setNewSongTitle('');
      setNewSongLyrics('');
      setShowAddForm(false);
    }
  };

  const moveToTop = async (title: string) => {
    const itemIndex = songItems.findIndex(item => item.title === title);
    if (itemIndex === -1) return;
    
    const newItems = [...songItems];
    const [movedItem] = newItems.splice(itemIndex, 1);
    newItems.unshift(movedItem);
    
    setSongItems(newItems);

    // Save the updated order to KV
    try {
      await fetch('/api/songs/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItems),
      });
    } catch (error) {
      console.error('Failed to save song order:', error);
    }
  };

  const handleUpdateTitle = async (oldTitle: string, newTitle: string) => {
    // Check for duplicate titles
    if (songs[newTitle]) {
      alert('A song with this title already exists!');
      return;
    }

    // Update state
    setSongs(prev => {
      const newSongs = { ...prev };
      newSongs[newTitle] = newSongs[oldTitle];
      delete newSongs[oldTitle];
      return newSongs;
    });

    setSongItems(prev => 
      prev.map(item => 
        item.title === oldTitle 
          ? { ...item, title: newTitle }
          : item
      )
    );

    if (selectedTitle === oldTitle) {
      setSelectedTitle(newTitle);
    }

    // Save to backend
    try {
      await fetch('/api/songs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ oldTitle, newTitle }),
      });
    } catch (error) {
      console.error('Failed to update song title:', error);
    }
  };

  const handleUpdateLyrics = async (title: string, newLyrics: string) => {
    // Update state
    setSongs(prev => ({
      ...prev,
      [title]: newLyrics
    }));

    // Save to backend
    try {
      await fetch('/api/songs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, lyrics: newLyrics }),
      });
    } catch (error) {
      console.error('Failed to update lyrics:', error);
    }
  };

  const adjustMasterFontSize = (delta: number) => {
    setMasterFontSize(prev => Math.max(8, Math.min(32, prev + delta)));
  };

  const handleExportJson = async () => {
    const blob = new Blob([JSON.stringify(songs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MAYDAY_songs.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen relative">
      {/* Add Song Form Modal */}
      {showAddForm && (
        <div className="absolute inset-0 z-10">
          <div className="flex h-full">
            {/* Left third - click through */}
            <div className="w-1/3" onClick={() => setShowAddForm(false)} />
            
            {/* Right two thirds - modal */}
            <div className="w-2/3 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-w-[90%]">
                <h2 className="text-xl font-semibold mb-4">Add New Song</h2>
                <form onSubmit={handleAddSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="songTitle" className="block text-sm font-medium text-gray-700 mb-1">
                      Song Title
                    </label>
                    <input
                      id="songTitle"
                      type="text"
                      value={newSongTitle}
                      onChange={(e) => setNewSongTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      placeholder="Enter song title"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label htmlFor="songLyrics" className="block text-sm font-medium text-gray-700 mb-1">
                      Lyrics
                    </label>
                    <textarea
                      id="songLyrics"
                      value={newSongLyrics}
                      onChange={(e) => setNewSongLyrics(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 min-h-[200px]"
                      placeholder="Enter song lyrics"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewSongTitle('');
                        setNewSongLyrics('');
                      }}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Add Song
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className={`flex-none transition-all duration-300 ${showLeftPane ? 'w-1/3' : 'w-0'}`}>
        {showLeftPane && (
          <div className="w-full h-full border-r border-gray-200 overflow-hidden">
            <SongList 
              songItems={songItems}
              selectedTitle={visibleSongTitle}
              onSelect={setSelectedTitle}
              onReorder={handleReorder}
              onToggleHidden={toggleHidden}
              onDelete={handleDelete}
              onAdd={() => setShowAddForm(true)}
              onMoveToTop={moveToTop}
            />
          </div>
        )}
      </div>
      
      {/* Right pane */}
      <div className="flex-1 overflow-hidden">
        <LyricsView 
          songs={songs}
          songItems={songItems}
          selectedTitle={selectedTitle}
          onUpdateTitle={handleUpdateTitle}
          onUpdateLyrics={handleUpdateLyrics}
          masterFontSize={masterFontSize}
          showLeftPane={showLeftPane}
          onVisibleSongChange={setVisibleSongTitle}
        />
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2">
        <button
          onClick={() => adjustMasterFontSize(1)}
          className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-colors"
          title="Increase All Text Size"
        >
          +
        </button>
        <button
          onClick={() => adjustMasterFontSize(-1)}
          className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-colors"
          title="Decrease All Text Size"
        >
          −
        </button>
        <button
          onClick={handleExportJson}
          className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center text-xl transition-colors"
          title="Export JSON"
        >
          ⤓
        </button>
        <button
          onClick={() => setShowLeftPane(!showLeftPane)}
          className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center text-xl transition-colors"
          title={showLeftPane ? "Hide Song List" : "Show Song List"}
        >
          {showLeftPane ? '◀' : '▶'}
        </button>
      </div>
    </div>
  );
}
