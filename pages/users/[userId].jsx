function Blog({ starts }) {
  return (
    <p>{stars}</p>
  )
}
export async function getStaticPaths() {
  // We'll pre-render only these paths at build time.
  // { fallback: blocking } will server-render pages
  // on-demand if the path doesn't exist.
  return { paths:[], fallback: 'blocking' };
}
// この関数はサーバー側のビルド時に呼び出されます。
// クライアント側では呼び出されないので、
// 直接データベースクエリを実行できます。
export async function getStaticProps() {
  const res = await fetch('https://api.github.com/repos/zeit/next.js')
  const json = await res.json()
  return {
    props: {
      stars: json.stargazers_count,
    },
  }
}

export default Blog