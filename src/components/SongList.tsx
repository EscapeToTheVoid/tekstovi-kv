import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult, DragStart, DragUpdate } from '@hello-pangea/dnd';
import { SongItem } from '@/types/songs';

interface SongListProps {
  songItems: SongItem[];
  selectedTitle: string;
  onSelect: (title: string) => void;
  onReorder: (newItems: SongItem[]) => void;
  onToggleHidden: (title: string) => void;
  onDelete: (title: string) => void;
  onAdd: () => void;
  onMoveToTop: (title: string) => void;
}

export default function SongList({
  songItems,
  selectedTitle,
  onSelect,
  onReorder,
  onToggleHidden,
  onDelete,
  onAdd,
  onMoveToTop,
}: SongListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [hideHidden, setHideHidden] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const handleDragEnd = (result: DropResult) => {
    setDraggingIndex(null);
    setDropTargetIndex(null);
    
    if (!result.destination) return;

    const items = Array.from(songItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onReorder(items);
  };

  const handleDragStart = (start: DragStart) => {
    setDraggingIndex(start.source.index);
  };

  const handleDragUpdate = (update: DragUpdate) => {
    setDropTargetIndex(update.destination?.index ?? null);
  };

  const getDisplayIndex = (index: number, item: SongItem) => {
    // If the song is hidden, don't show a number
    if (item.hidden) return '';

    // Count how many visible songs are before this one
    const visibleIndex = filteredSongs
      .slice(0, index)
      .filter(song => !song.hidden)
      .length;

    if (draggingIndex === null || dropTargetIndex === null) {
      return visibleIndex + 1;
    }

    const draggedItem = filteredSongs[draggingIndex];
    const isDraggingVisible = !draggedItem.hidden;

    // If we're dragging a hidden item, numbering doesn't change
    if (!isDraggingVisible) return visibleIndex + 1;

    // If this is the dragged item and it's visible, show its potential position
    if (index === draggingIndex) {
      const visibleDropIndex = filteredSongs
        .slice(0, dropTargetIndex)
        .filter(song => !song.hidden)
        .length;
      return visibleDropIndex + 1;
    }

    // Adjust numbers for other visible items during drag
    const dragVisibleIndex = filteredSongs
      .slice(0, draggingIndex)
      .filter(song => !song.hidden)
      .length;

    const dropVisibleIndex = filteredSongs
      .slice(0, dropTargetIndex)
      .filter(song => !song.hidden)
      .length;

    if (dragVisibleIndex < dropVisibleIndex) {
      if (visibleIndex > dragVisibleIndex && visibleIndex <= dropVisibleIndex) {
        return visibleIndex;
      }
    } else {
      if (visibleIndex >= dropVisibleIndex && visibleIndex < dragVisibleIndex) {
        return visibleIndex + 2;
      }
    }

    return visibleIndex + 1;
  };

  const handleDelete = (title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      onDelete(title);
    }
  };

  const filteredSongs = songItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesHidden = hideHidden ? !item.hidden : true;
    return matchesSearch && matchesHidden;
  });

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchTerm('');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        {/* Buttons Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onAdd}
              className="p-2 text-gray-600 hover:text-blue-500 transition-colors"
              title="Add New Song"
            >
              ➕
            </button>
            <button
              onClick={toggleSearch}
              className={`p-2 text-gray-600 hover:text-blue-500 transition-colors ${
                showSearch ? 'text-blue-500' : ''
              }`}
              title={showSearch ? "Hide Search" : "Show Search"}
            >
              🔎
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHideHidden(!hideHidden)}
              className={`p-2 text-gray-600 hover:text-blue-500 transition-colors ${
                hideHidden ? 'text-blue-500' : ''
              }`}
              title={hideHidden ? "Show Hidden Songs" : "Hide Hidden Songs"}
            >
              {hideHidden ? '👁️‍🗨️' : '👁️'}
            </button>
            <button
              onClick={() => setShowTools(!showTools)}
              className={`p-2 text-gray-600 hover:text-blue-500 transition-colors ${
                showTools ? 'text-blue-500' : ''
              }`}
              title={showTools ? "Hide Tools" : "Show Tools"}
            >
              {showTools ? '⛓️‍💥' : '🔗'}
            </button>
          </div>
        </div>

        {/* Search Input */}
        {showSearch && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search songs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <DragDropContext 
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
          onDragUpdate={handleDragUpdate}
        >
          <Droppable droppableId="songs">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-1 p-2"
              >
                {filteredSongs.map((item, index) => (
                  <Draggable
                    key={item.title}
                    draggableId={item.title}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`
                          flex items-center gap-2 p-2 rounded cursor-pointer
                          ${selectedTitle === item.title ? 'bg-blue-100' : 'hover:bg-gray-100'}
                          ${item.hidden ? 'opacity-50 bg-gray-100' : ''}
                          ${snapshot.isDragging ? 'shadow-lg' : ''}
                        `}
                        onClick={() => onSelect(item.title)}
                      >
                        <span className="w-8 text-right text-gray-400">
                          {getDisplayIndex(index, item) && `${getDisplayIndex(index, item)}.`}
                        </span>
                        <span className="flex-1 truncate">{item.title}</span>
                        {showTools && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleHidden(item.title);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                              title={item.hidden ? "Show" : "Hide"}
                            >
                              {item.hidden ? "👁️" : "👁"}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveToTop(item.title);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                              title="Move to Top"
                            >
                              ⤒
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(item.title);
                              }}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
} 