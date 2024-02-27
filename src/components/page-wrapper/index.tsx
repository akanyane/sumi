"use client"
import { FC, ReactNode, CSSProperties } from "react"

type PageWrapperProps = {
  children: ReactNode
}

const PageWrapper: FC<PageWrapperProps> = ({ children }) => {
  const styles: CSSProperties = {
    minHeight: '100vh', 
    display: 'flex', 
    flexDirection: 'column', 
    justifyContent: 'space-between',
  }
  return (
    <div style={styles}>
      {children}
    </div>
  )
}

export default PageWrapper
