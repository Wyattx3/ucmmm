import React from 'react';
import styled from 'styled-components';

const MemberCard = () => {
  return (
    <StyledWrapper>
      <div className="card">
        <div className="content">
          <div className="back">
            <div className="back-content">
              <svg stroke="#ffffff" xmlnsXlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" height="50px" width="50px" fill="#ffffff">
                <g strokeWidth={0} id="SVGRepo_bgCarrier" />
                <g strokeLinejoin="round" strokeLinecap="round" id="SVGRepo_tracerCarrier" />
                <g id="SVGRepo_iconCarrier">
                  <path d="M20.84375 0.03125C20.191406 0.0703125 19.652344 0.425781 19.21875 1.53125C18.988281 2.117188 18.5 3.558594 18.03125 4.9375C17.792969 5.636719 17.570313 6.273438 17.40625 6.75C17.390625 6.796875 17.414063 6.855469 17.40625 6.90625C17.398438 6.925781 17.351563 6.949219 17.34375 6.96875L17.25 7.25C18.566406 7.65625 19.539063 8.058594 19.625 8.09375C22.597656 9.21875 28.351563 11.847656 33.28125 16.78125C38.5 22 41.183594 28.265625 42.09375 30.71875C42.113281 30.761719 42.375 31.535156 42.75 32.84375C42.757813 32.839844 42.777344 32.847656 42.78125 32.84375C43.34375 32.664063 44.953125 32.09375 46.3125 31.625C47.109375 31.351563 47.808594 31.117188 48.15625 31C49.003906 30.714844 49.542969 30.292969 49.8125 29.6875C50.074219 29.109375 50.066406 28.429688 49.75 27.6875C49.605469 27.347656 49.441406 26.917969 49.25 26.4375C47.878906 23.007813 45.007813 15.882813 39.59375 10.46875C33.613281 4.484375 25.792969 1.210938 22.125 0.21875C21.648438 0.0898438 21.234375 0.0078125 20.84375 0.03125 Z M 16.46875 9.09375L0.0625 48.625C-0.09375 48.996094 -0.00390625 49.433594 0.28125 49.71875C0.472656 49.910156 0.738281 50 1 50C1.128906 50 1.253906 49.988281 1.375 49.9375L40.90625 33.59375C40.523438 32.242188 40.222656 31.449219 40.21875 31.4375C39.351563 29.089844 36.816406 23.128906 31.875 18.1875C27.035156 13.34375 21.167969 10.804688 18.875 9.9375C18.84375 9.925781 17.8125 9.5 16.46875 9.09375 Z M 17 16C19.761719 16 22 18.238281 22 21C22 23.761719 19.761719 26 17 26C15.140625 26 13.550781 24.972656 12.6875 23.46875L15.6875 16.1875C16.101563 16.074219 16.550781 16 17 16 Z M 31 22C32.65625 22 34 23.34375 34 25C34 25.917969 33.585938 26.730469 32.9375 27.28125L32.90625 27.28125C33.570313 27.996094 34 28.949219 34 30C34 32.210938 32.210938 34 30 34C27.789063 34 26 32.210938 26 30C26 28.359375 26.996094 26.960938 28.40625 26.34375L28.3125 26.3125C28.117188 25.917969 28 25.472656 28 25C28 23.34375 29.34375 22 31 22 Z M 21 32C23.210938 32 25 33.789063 25 36C25 36.855469 24.710938 37.660156 24.25 38.3125L20.3125 39.9375C18.429688 39.609375 17 37.976563 17 36C17 33.789063 18.789063 32 21 32 Z M 9 34C10.65625 34 12 35.34375 12 37C12 38.65625 10.65625 40 9 40C7.902344 40 6.960938 39.414063 6.4375 38.53125L8.25 34.09375C8.488281 34.03125 8.742188 34 9 34Z" />
                </g>
              </svg>
              <strong>Member Card</strong>
            </div>
          </div>
          <div className="front">
            <div className="img">
              <div className="circle">
              </div>
              <div className="circle" id="right">
              </div>
              <div className="circle" id="bottom">
              </div>
            </div>
            <div className="front-content">
              <small className="badge">Member</small>
              <div className="description">
                <div className="title">
                  <p className="title">
                    <strong>UC ERA Member Card</strong>
                  </p>
                  <svg fillRule="nonzero" height="15px" width="15px" viewBox="0,0,256,256" xmlnsXlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"><g style={{mixBlendMode: 'normal'}} textAnchor="none" fontSize="none" fontWeight="none" fontFamily="none" strokeDashoffset={0} strokeDasharray="none" strokeMiterlimit={10} strokeLinejoin="miter" strokeLinecap="butt" strokeWidth={1} stroke="none" fillRule="nonzero" fill="#20c997"><g transform="scale(8,8)"><path d="M25,27l-9,-6.75l-9,6.75v-23h18z" /></g></g></svg>
                </div>
                <p className="card-footer">
                  Digital ID &nbsp; | &nbsp; Active
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .card {
    overflow: visible;
    width: 280px;  /* Landscape width */
    height: 180px; /* Landscape height */
  }

  .content {
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    transition: transform 300ms;
    box-shadow: 0px 0px 15px 2px #2563eb44;
    border-radius: 12px;
  }

  .front, .back {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    border-radius: 12px;
    overflow: hidden;
  }

  .back {
    width: 100%;
    height: 100%;
    justify-content: center;
    display: flex;
    align-items: center;
    overflow: hidden;
  }

  .back::before {
    position: absolute;
    content: ' ';
    display: block;
    width: 200px;
    height: 160%;
    background: linear-gradient(90deg, transparent, #60a5fa, #3b82f6, #2563eb, #1d4ed8, transparent);
    animation: rotation_481 5000ms infinite linear;
  }

  .back-content {
    position: absolute;
    width: 99%;
    height: 99%;
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    border-radius: 12px;
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 20px;
  }

  .card:hover .content {
    transform: rotateY(180deg);
  }

  @keyframes rotation_481 {
    0% {
      transform: rotateZ(0deg);
    }
    100% {
      transform: rotateZ(360deg);
    }
  }

  .front {
    transform: rotateY(180deg);
    color: white;
  }

  .front .front-content {
    position: absolute;
    width: 100%;
    height: 100%;
    padding: 16px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .front-content .badge {
    background-color: #ffffff33;
    padding: 4px 12px;
    border-radius: 20px;
    backdrop-filter: blur(3px);
    width: fit-content;
    font-size: 12px;
    font-weight: 600;
    color: #ffffff;
  }

  .description {
    box-shadow: 0px 0px 15px 5px #00000044;
    width: 100%;
    padding: 12px;
    background-color: #ffffff22;
    backdrop-filter: blur(8px);
    border-radius: 8px;
  }

  .title {
    font-size: 14px;
    max-width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .title p {
    width: 70%;
    margin: 0;
    font-weight: 700;
  }

  .card-footer {
    color: #ffffff99;
    margin-top: 8px;
    font-size: 11px;
    font-weight: 500;
  }

  .front .img {
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  .circle {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: #60a5fa;
    position: relative;
    filter: blur(12px);
    animation: floating 2600ms infinite linear;
  }

  #bottom {
    background-color: #3b82f6;
    left: 80px;
    top: 10px;
    width: 100px;
    height: 100px;
    animation-delay: -800ms;
  }

  #right {
    background-color: #1e40af;
    left: 200px;
    top: -60px;
    width: 40px;
    height: 40px;
    animation-delay: -1800ms;
  }

  @keyframes floating {
    0% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(8px);
    }
    100% {
      transform: translateY(0px);
    }
  }
`;

export default MemberCard; 