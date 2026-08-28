import KnowledgeSearch from '../../components/knowledge/KnowledgeSearch';

export default function KnowledgeSearchPage() {
  return (
    <section>
      <div className="section-header">
        <div>
          <h1>Tra cứu tri thức</h1>
          <p>Tìm kiếm tài liệu, kỹ thuật tập, dinh dưỡng từ kho tri thức.</p>
        </div>
      </div>
      <KnowledgeSearch />
    </section>
  );
}
