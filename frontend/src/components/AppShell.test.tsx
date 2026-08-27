// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('nhóm menu, đánh dấu route con đang active và hiển thị breadcrumb', () => {
    render(<MemoryRouter initialEntries={['/portal/pt/roadmaps/roadmap-1']}><AppShell user={{ username: 'pt-a', role: 'PT' }} features={{ ROADMAP: true }}><div>Chi tiết roadmap</div></AppShell></MemoryRouter>);

    expect(screen.getByText('Tổng quan')).toBeVisible();
    expect(screen.getAllByText('Vận hành')[0]).toBeVisible();
    expect(screen.getByText('Tri thức & trợ lý')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Roadmap' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('navigation', { name: 'Điều hướng trang' })).toHaveTextContent('PortalVận hànhRoadmap');
  });

  it('đóng menu mobile sau khi chọn một điểm đến', async () => {
    const user = userEvent.setup();
    const { container } = render(<MemoryRouter><AppShell user={{ username: 'customer-a', role: 'CUSTOMER' }}><div>Portal</div></AppShell></MemoryRouter>);

    await user.click(screen.getByRole('button', { name: 'Menu' }));
    expect(container.querySelector('.portal-sidebar')).toHaveClass('mobile-open');
    await user.click(screen.getByRole('link', { name: 'Hành trình của tôi' }));
    expect(container.querySelector('.portal-sidebar')).not.toHaveClass('mobile-open');
  });

  it('chỉ đánh dấu điểm đến cụ thể nhất khi route lồng nhau', () => {
    render(<MemoryRouter initialEntries={['/portal/admin/knowledge']}><AppShell user={{ username: 'admin', role: 'ADMIN' }} features={{ KNOWLEDGE_BASE: true }}><div>Kho tri thức</div></AppShell></MemoryRouter>);

    expect(screen.getByRole('link', { name: 'Kho tri thức' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Quản lý PT' })).not.toHaveAttribute('aria-current');
  });
});
