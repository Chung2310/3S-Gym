// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import FeatureGate from './FeatureGate';
import { FeaturesProvider } from '../../services/features';

describe('FeatureGate', () => {
  it('hiển thị nội dung khi feature được bật', () => {
    render(<FeaturesProvider initialFeatures={{ ROADMAP: true }}><FeatureGate feature="ROADMAP">Lộ trình</FeatureGate></FeaturesProvider>);
    expect(screen.getByText('Lộ trình')).toBeVisible();
  });

  it('ẩn nội dung và hiển thị fallback khi feature bị tắt', () => {
    render(<FeaturesProvider initialFeatures={{ ROADMAP: false }}><FeatureGate feature="ROADMAP" fallback={<p>Tính năng chưa khả dụng</p>}>Lộ trình</FeatureGate></FeaturesProvider>);
    expect(screen.queryByText('Lộ trình')).not.toBeInTheDocument();
    expect(screen.getByText('Tính năng chưa khả dụng')).toBeVisible();
  });
});
