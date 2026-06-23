import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '../components/Header';

describe('Header Component', () => {
  it('renders the title correctly', () => {
    render(<Header isPremium={false} hasSharedToday={false} />);
    expect(screen.getByText('Mapendo')).toBeDefined();
  });

  it('shows premium status when isPremium is true', () => {
    render(<Header isPremium={true} hasSharedToday={false} />);
    expect(screen.getByText(/Accès Premium Illimité Activé/i)).toBeDefined();
  });
});
