// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import FeatureRoute from './FeatureRoute';
import { FeaturesProvider } from '../services/features';

describe('FeatureRoute', () => {
  it('render route khi đúng role và feature được bật', () => {
    render(<MemoryRouter initialEntries={['/portal/pt/assistant']}><FeaturesProvider initialFeatures={{ PT_ASSISTANT: true }}><Routes><Route path="/portal/pt/assistant" element={<FeatureRoute user={{ username: 'pt-a', role: 'PT' }} roles={['PT']} feature="PT_ASSISTANT"><p>PT Assistant</p></FeatureRoute>} /></Routes></FeaturesProvider></MemoryRouter>);
    expect(screen.getByText('PT Assistant')).toBeVisible();
  });

  it('chuyển về portal gốc khi sai role', () => {
    render(<MemoryRouter initialEntries={['/portal/admin']}><Routes><Route path="/portal/admin" element={<FeatureRoute user={{ username: 'pt-a', role: 'PT' }} roles={['ADMIN']}><p>Quản trị</p></FeatureRoute>} /><Route path="/portal" element={<p>Portal an toàn</p>} /></Routes></MemoryRouter>);
    expect(screen.getByText('Portal an toàn')).toBeVisible();
    expect(screen.queryByText('Quản trị')).not.toBeInTheDocument();
  });

  it('chặn route khi feature bị tắt', () => {
    render(<MemoryRouter><FeaturesProvider initialFeatures={{ ROADMAP: false }}><FeatureRoute user={{ username: 'pt-a', role: 'PT' }} roles={['PT']} feature="ROADMAP"><p>Lộ trình</p></FeatureRoute></FeaturesProvider></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Tính năng chưa khả dụng' })).toBeVisible();
    expect(screen.queryByText('Lộ trình')).not.toBeInTheDocument();
  });
});
