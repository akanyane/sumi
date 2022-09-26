import styled from "styled-components";

export const Container = styled.header`
  display: flex;
  flex-direction: row;
  width: 100vw;
  height: 10vh;
  justify-content: center;
  align-items: center;
  box-shadow:0 1px 4px rgba(0, 0, 0, 0.3);
  -moz-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  user-select: none;
  @media only screen and (max-width: 1024px) {
    
  }

`

export const Button = styled.button`
  display: flex;
  text-shadow: 0 1px 1px #bbb,
  0 1px 0 #999,
  0 2px 0 #888,
  0 2px 0 #777,
  0 3px 0 #666,
  0 3px 0 #555,
  0 4px 0 #444,
  0 4px 0 #333,
  0 5px 7px #302314;
  align-items: center;
  justify-content: center;
  width: 150px;
  height: 50px;
  background: #047a84;
  cursor: pointer;
  appearance: none;
  color: white;
  outline: none;
  font-size: 45px;
  font-weight: 900;
  @media only screen and (max-width: 1024px) {

  }
`

export const PageNumber = styled.h1`
  width: 30vw;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 900;
  font-size: 35px;
  text-shadow: 0 1px 1px #bbb,
  0 1px 0 #999,
  0 2px 0 #888,
  0 2px 0 #777,
  0 3px 0 #666,
  0 3px 0 #555,
  0 4px 0 #444,
  0 4px 0 #333,
  0 5px 7px #302314;
  @media only screen and (max-width: 1024px) {
    font-size: 25px;
  }
`


