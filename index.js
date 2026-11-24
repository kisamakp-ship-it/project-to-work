export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const adminKey = env.ADMIN_KEY

    // 提交记录接口
    if (url.pathname === "/api/submit" && request.method === "POST") {
      const body = await request.json()
      await env.DB.prepare(`
        INSERT INTO pd_record (patient_id, record_time, weight, bp_high, bp_low, ultrafiltration, anxiety_score, nutrition_score, remark)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        body.patient_id,
        new Date().toISOString(),
        body.weight,
        body.bp_high,
        body.bp_low,
        body.ultrafiltration,
        body.anxiety_score,
        body.nutrition_score,
        body.remark
      ).run()
      return Response.json({ok:true})
    }

    // 管理员查询接口，需要密钥
    if (url.pathname === "/api/list" && request.method === "GET") {
      const key = url.searchParams.get("key")
      if(key !== adminKey) return Response.json({err:"无权限"}, {status:403})
      const {results} = await env.DB.prepare("SELECT * FROM pd_record ORDER BY record_time DESC").all()
      return Response.json(results)
    }

    // 内置表单页面
    if(url.pathname === "/"){
      return new Response(`
      <!DOCTYPE html>
      <html>
      <body>
        <h3>腹透记录表单</h3>
        <form id="form">
          <input name="patient_id" placeholder="患者编号"><br>
          <input name="weight" placeholder="体重"><br>
          <input name="bp_high" placeholder="收缩压"><br>
          <input name="bp_low" placeholder="舒张压"><br>
          <input name="ultrafiltration" placeholder="超滤量"><br>
          <input name="anxiety_score" placeholder="焦虑评分"><br>
          <input name="nutrition_score" placeholder="营养评分"><br>
          <textarea name="remark" placeholder="备注"></textarea>
          <button type="submit">提交</button>
        </form>
        <script>
          const form = document.querySelector('#form')
          form.onsubmit = async (e)=>{
            e.preventDefault()
            const fd = new FormData(form)
            const data = Object.fromEntries(fd)
            const res = await fetch('/api/submit',{
              method:'POST',
              body:JSON.stringify(data),
              headers:{'Content-Type':'application/json'}
            })
            const ret = await res.json()
            if(ret.ok) alert('提交成功！')
            else alert('提交失败')
          }
        </script>
      </body>
      </html>
      `,{headers:{"content-type":"text/html"}})
    }

    return Response.json({msg:"路由不存在"})
  }
}
