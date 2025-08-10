import React from 'react';
import styled from 'styled-components';

const More = () => {
  return (
    <MoreGrid>
      <MoreCard>
        <div className="icon">📅</div>
        <div className="title">Events</div>
        <div className="desc">Discover upcoming activities</div>
        <Badge>Coming soon</Badge>
      </MoreCard>
      <MoreCard>
        <div className="icon">🛍️</div>
        <div className="title">Marketplace</div>
        <div className="desc">Share and exchange</div>
        <Badge>Coming soon</Badge>
      </MoreCard>
      <MoreCard>
        <div className="icon">📄</div>
        <div className="title">Documents</div>
        <div className="desc">Resources & forms</div>
        <Badge>Coming soon</Badge>
      </MoreCard>
    </MoreGrid>
  );
};

// Styled Components
const MoreGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media (min-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }
  @media (min-width: 640px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
  }
`;

const MoreCard = styled.div`
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 14px;
  padding: 14px;
  text-align: center;
  .icon { font-size: 22px; }
  .title { font-weight: 700; color: #0f172a; margin-top: 6px; }
  .desc { font-size: 12px; color: #64748b; margin-top: 2px; margin-bottom: 6px; }
  @media (min-width: 480px) {
    padding: 16px;
    .icon { font-size: 24px; }
  }
`;

const Badge = styled.span`
  display: inline-block;
  padding: 6px 10px;
  border-radius: 9999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
`;

export default More;