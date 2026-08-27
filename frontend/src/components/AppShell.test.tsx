// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppShell from './AppShell';

describe('AppShell', () => {
  it('hiển thị vai trò và nội dung portal', () => {
    render(<MemoryRouter><AppShell user={{ username: 'pt-minh', fullName: 'PT Minh', role: 'PT' }}><div>Nội dung CRM</div></AppShell></MemoryRouter>);
    expect(screen.getAllByText('PT Minh')).toHaveLength(2);
    expect(screen.getByText('Nội dung CRM')).toBeInTheDocument();
  });

  it('chỉ hiển thị navigation phù hợp vai trò và feature', () => {
    render(<MemoryRouter><AppShell user={{ username: 'customer-a', role: 'CUSTOMER' }} features={{ PT_ASSISTANT: true }}><div>Portal</div></AppShell></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Hành trình của tôi' })).toHaveAttribute('href', '/portal/me');
    expect(screen.queryByRole('link', { name: 'PT Assistant' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Quản lý PT' })).not.toBeInTheDocument();
  });

  it('hiển thị workspace InBody và Roadmap cho PT theo feature flags', () => {
    render(<MemoryRouter><AppShell user={{ username: 'pt-a', role: 'PT' }} features={{ OCR_INBODY: true, ROADMAP: true }}><div>Portal</div></AppShell></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'InBody OCR' })).toHaveAttribute('href', '/portal/pt/inbody');
    expect(screen.getByRole('link', { name: 'Roadmap' })).toHaveAttribute('href', '/portal/pt/roadmaps');
  });
});
