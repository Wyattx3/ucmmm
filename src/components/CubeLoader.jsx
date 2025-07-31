import React from 'react';
import styled from 'styled-components';

const CubeLoader = ({ message = 'Loading...' }) => {
  return (
    <StyledWrapper>
      <div className="cube-loader">
        <div className="cube cube1" />
        <div className="cube cube2" />
        <div className="cube cube3" />
        <div className="cube cube4" />
      </div>
      {message && <div className="loading-message">{message}</div>}
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .cube-loader {
    position: relative;
    width: 50px;
    height: 50px;
    margin: auto;
  }

  .cube {
    position: absolute;
    width: 50%;
    height: 50%;
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    border: 2px solid #fff;
    border-radius: 4px;
    animation: foldCube 2.4s infinite linear;
    box-shadow: 0 4px 8px rgba(37, 99, 235, 0.3);
  }

  /* Individual cube positioning */
  .cube1 {
    top: 0;
    left: 0;
    transform-origin: 100% 100%;
  }
  .cube2 {
    top: 0;
    right: 0;
    transform-origin: 0 100%;
  }
  .cube3 {
    bottom: 0;
    right: 0;
    transform-origin: 0 0;
  }
  .cube4 {
    bottom: 0;
    left: 0;
    transform-origin: 100% 0;
  }

  /* Keyframes for the folding animation */
  @keyframes foldCube {
    0%,
    10% {
      transform: perspective(140px) rotateX(-180deg);
      opacity: 0;
    }
    25%,
    75% {
      transform: perspective(140px) rotateX(0deg);
      opacity: 1;
    }
    90%,
    100% {
      transform: perspective(140px) rotateY(180deg);
      opacity: 0;
    }
  }

  /* Animation delay for each cube */
  .cube1 {
    animation-delay: 0.3s;
  }
  .cube2 {
    animation-delay: 0.6s;
  }
  .cube3 {
    animation-delay: 0.9s;
  }
  .cube4 {
    animation-delay: 1.2s;
  }

  .loading-message {
    color: #374151;
    font-size: 16px;
    font-weight: 500;
    text-align: center;
    margin-top: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  }
`;

export default CubeLoader; 