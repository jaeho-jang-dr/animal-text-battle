import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CharacterCard from '../../../components/CharacterCard'

// Mock Character type
const mockCharacter = {
  id: 'char-1',
  characterName: 'Leo',
  baseScore: 1000,
  wins: 5,
  losses: 2,
  activeBattlesToday: 3,
  battleText: 'Roar!',
  animal: {
    id: 'animal-1',
    name: 'Lion',
    korean_name: '사자',
    emoji: '🦁',
    category: 'legend',
    image: 'lion.png',
    description: 'King of the jungle',
    grade: 'A',
    power: 100,
    speed: 80,
    defense: 60,
    health: 1000,
  }
}

describe('CharacterCard', () => {
  it('should render character information', () => {
    render(<CharacterCard character={mockCharacter} />)
    
    expect(screen.getByText('Leo')).toBeDefined()
    expect(screen.getByText('사자')).toBeDefined()
    expect(screen.getByText('🦁')).toBeDefined()
    expect(screen.getByText('5승 2패')).toBeDefined()
    expect(screen.getByText('"Roar!"')).toBeDefined()
  })

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<CharacterCard character={mockCharacter} onClick={handleClick} />)
    
    // Click the card (the outer div)
    // Since we can't easily select the outer div by role, we can use a test id or just click the text and bubble up
    fireEvent.click(screen.getByText('Leo'))
    
    expect(handleClick).toHaveBeenCalled()
  })

  it('should show stats when showStats is true', () => {
    render(<CharacterCard character={mockCharacter} showStats={true} />)
    expect(screen.getByText('🔥 파워')).toBeDefined()
    expect(screen.getByText('1000')).toBeDefined()
  })

  it('should not show stats when showStats is false', () => {
    render(<CharacterCard character={mockCharacter} showStats={false} />)
    expect(screen.queryByText('🔥 파워')).toBeNull()
  })

  it('should enter edit mode when edit button is clicked', () => {
    const handleUpdate = vi.fn()
    render(<CharacterCard character={mockCharacter} onUpdateBattleText={handleUpdate} />)
    
    const editButton = screen.getByText('✏️ 수정')
    fireEvent.click(editButton)
    
    expect(screen.getByPlaceholderText('배틀 시작 시 외칠 대사!')).toBeDefined()
    expect(screen.getByText('저장')).toBeDefined()
    expect(screen.getByText('취소')).toBeDefined()
  })
})
