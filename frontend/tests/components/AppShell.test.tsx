// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AppShell from '../../src/components/AppShell';

describe('AppShell', () => {
  it('hiển thị vai trò và nội dung portal', () => {
    render(<MemoryRouter><AppShell user={{ username: 'pt-minh', fullName: 'PT Minh', role: 'PT' }}><div>Nội dung CRM</div></AppShell></MemoryRouter>);
    expect(screen.getByText('PT Minh')).toBeInTheDocument();
    expect(screen.getByText('Huấn luyện viên')).toBeInTheDocument();
    expect(screen.getByText('Nội dung CRM')).toBeInTheDocument();

    const actions = document.querySelector('.portal-header-actions');
    expect(actions).toHaveClass('ml-auto', 'flex', 'shrink-0', 'items-center', 'gap-2');
    const notificationButton = actions?.querySelector('button[aria-haspopup="dialog"]');
    expect(notificationButton).toBeInTheDocument();
    expect(actions?.querySelector('.portal-header-user')).toHaveTextContent('PT Minh');
    expect(actions?.firstElementChild).toContainElement(notificationButton as HTMLElement);
  });

  it('chỉ hiển thị navigation phù hợp vai trò và feature', () => {
    render(<MemoryRouter><AppShell user={{ username: 'customer-a', role: 'CUSTOMER' }} features={{ PT_ASSISTANT: true }}><div>Portal</div></AppShell></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Hành trình của tôi' })).toHaveAttribute('href', '/me');
    expect(screen.queryByRole('link', { name: 'PT Assistant' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Quản lý PT' })).not.toBeInTheDocument();
  });

  it('hiển thị workspace InBody và Roadmap cho PT theo feature flags', () => {
    render(<MemoryRouter><AppShell user={{ username: 'pt-a', role: 'PT' }} features={{ OCR_INBODY: true, ROADMAP: true }}><div>Portal</div></AppShell></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'InBody OCR' })).toHaveAttribute('href', '/pt/inbody');
    expect(screen.getByRole('link', { name: 'Roadmap' })).toHaveAttribute('href', '/pt/roadmaps');
  });

  it('nhóm menu, đánh dấu route con đang active và hiển thị breadcrumb', () => {
    render(<MemoryRouter initialEntries={['/pt/roadmaps/roadmap-1']}><AppShell user={{ username: 'pt-a', role: 'PT' }} features={{ ROADMAP: true }}><div>Chi tiết roadmap</div></AppShell></MemoryRouter>);

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
    render(<MemoryRouter initialEntries={['/admin/knowledge']}><AppShell user={{ username: 'admin', role: 'ADMIN' }} features={{ KNOWLEDGE_BASE: true }}><div>Kho tri thức</div></AppShell></MemoryRouter>);

    expect(screen.getByRole('link', { name: 'Kho tri thức' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Quản lý PT' })).not.toHaveAttribute('aria-current');
  });
});
