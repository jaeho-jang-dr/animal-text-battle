import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import BattleEnergyBar from '../../../components/BattleEnergyBar'

describe('BattleEnergyBar', () => {
  const defaultProps = {
    characterName: 'Test Character',
    emoji: '🦁',
    maxEnergy: 100,
    currentEnergy: 80,
    isAttacker: true,
    combatPower: 500,
    showAnimation: false,
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render character information', () => {
    render(<BattleEnergyBar {...defaultProps} />)
    
    expect(screen.getByText('Test Character')).toBeDefined()
    expect(screen.getByText('🦁')).toBeDefined()
    expect(screen.getByText('전투력: 500')).toBeDefined()
  })

  it('should display correct energy percentage after animation', () => {
    render(<BattleEnergyBar {...defaultProps} showAnimation={true} />)
    
    // Initially it shows max energy (100%)
    expect(screen.getByText('100%')).toBeDefined()
    
    // Fast-forward time
    act(() => {
      vi.runAllTimers()
    })
    
    // 80/100 = 80%
    expect(screen.getByText('80%')).toBeDefined()
    expect(screen.getByText('80 / 100')).toBeDefined()
  })

  it('should stay at max energy if animation is disabled', () => {
    render(<BattleEnergyBar {...defaultProps} showAnimation={false} />)
    
    // Current implementation stays at max energy if animation is off
    expect(screen.getByText('100%')).toBeDefined()
  })

  it('should render in attacker mode (items-start)', () => {
    const { container } = render(<BattleEnergyBar {...defaultProps} isAttacker={true} />)
    // Check for class that indicates alignment
    const wrapper = container.firstChild
    expect(wrapper?.className).toContain('items-start')
  })

  it('should render in defender mode (items-end)', () => {
    const { container } = render(<BattleEnergyBar {...defaultProps} isAttacker={false} />)
    const wrapper = container.firstChild
    expect(wrapper?.className).toContain('items-end')
  })
})
