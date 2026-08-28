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

  it('hiển thị icon chuông thông báo và avatar tròn ở header', () => {
    render(
      <MemoryRouter>
        <AppShell user={{ username: 'pt-lan', fullName: 'Lan Nguyen', role: 'PT' }}>
          <div>Portal</div>
        </AppShell>
      </MemoryRouter>
    );

    const bellBtn = screen.getByRole('button', { name: 'Thông báo' });
    expect(bellBtn).toBeInTheDocument();

    expect(screen.getByText('LN')).toBeInTheDocument();
    expect(screen.getByText('Lan Nguyen')).toBeInTheDocument();
    expect(screen.getByText('Huấn luyện viên')).toBeInTheDocument();
  });
});

