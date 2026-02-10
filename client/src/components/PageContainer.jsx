export default function PageContainer({ className = '', children }) {
  return <section className={`container-pad py-10 ${className}`}>{children}</section>
}
