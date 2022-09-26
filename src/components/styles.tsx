import styled from "styled-components";

export const Container = styled.div`
  width: 150px;
  color: white;
  height: 160px;
  background: #047a84;
  display: flex;
  flex-direction: column;
  margin: 15px 15px 15px 15px;
  text-shadow: 0 1px 1px #bbb,
  0 2px 0 #999,
  0 3px 0 #888,
  0 4px 0 #777,
  0 5px 0 #666,
  0 6px 0 #555,
  0 7px 0 #444,
  0 8px 0 #333,
  0 9px 7px #302314;
  outline: none;
  -moz-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  user-select: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  align-content: center;
  justify-content: center;
  &:hover {
    transition: 0.25s ease;
    cursor: pointer;
    transform: translateY(-15px);
  }
  
`

export const Kanji = styled.div`
  width: auto;
  height:auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 90px;
  text-align: center;
  outline: none;
`

