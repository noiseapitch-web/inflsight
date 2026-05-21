export interface CalcResult { value: number | null; formula: string; missing_data: string[]; }
export interface MetricInput { likes: number|null; comments: number|null; shares: number|null; video_views: number|null; follower_count: number|null; fee: number|null; }
export interface CalculatedMetrics { engagement_count:CalcResult; engagement_rate_by_followers:CalcResult; engagement_rate_by_views:CalcResult; like_rate:CalcResult; comment_rate:CalcResult; share_rate:CalcResult; cpv:CalcResult; cpe:CalcResult; }

function d(num:number|null, den:number|null, f:string, miss:string[]):CalcResult {
  if(num===null||den===null) return {value:null,formula:f,missing_data:miss};
  if(den===0) return {value:null,formula:f,missing_data:[...miss,"분모=0"]};
  return {value:num/den,formula:f,missing_data:[]};
}

export function calculate(m:MetricInput):CalculatedMetrics {
  const miss:string[]=[];
  if(m.likes===null) miss.push("likes=null");
  if(m.comments===null) miss.push("comments=null");
  if(m.shares===null) miss.push("shares=null");
  const allNull=m.likes===null&&m.comments===null&&m.shares===null;
  const ec=allNull?null:(m.likes??0)+(m.comments??0)+(m.shares??0);
  return {
    engagement_count:{value:ec,formula:"likes+comments+shares",missing_data:miss},
    engagement_rate_by_followers:d(ec!==null&&m.follower_count!==null?(ec/m.follower_count)*100:null,1,"ec/follower*100",[...(ec===null?["ec=null"]:[]),...(m.follower_count===null?["follower=null"]:[])]),
    engagement_rate_by_views:d(ec!==null&&m.video_views!==null?(ec/m.video_views)*100:null,1,"ec/views*100",[...(ec===null?["ec=null"]:[]),...(m.video_views===null?["views=null"]:[])]),
    like_rate:d(m.likes!==null&&m.video_views!==null?(m.likes/m.video_views)*100:null,1,"likes/views*100",[...(m.likes===null?["likes=null"]:[]),...(m.video_views===null?["views=null"]:[])]),
    comment_rate:d(m.comments!==null&&m.video_views!==null?(m.comments/m.video_views)*100:null,1,"comments/views*100",[...(m.comments===null?["comments=null"]:[]),...(m.video_views===null?["views=null"]:[])]),
    share_rate:d(m.shares!==null&&m.video_views!==null?(m.shares/m.video_views)*100:null,1,"shares/views*100",[...(m.shares===null?["shares=null"]:[]),...(m.video_views===null?["views=null"]:[])]),
    cpv:d(m.fee!==null&&m.video_views!==null?m.fee/m.video_views:null,1,"fee/views",[...(m.fee===null?["fee=null"]:[]),...(m.video_views===null?["views=null"]:[])]),
    cpe:d(m.fee!==null&&ec!==null?m.fee/ec:null,1,"fee/ec",[...(m.fee===null?["fee=null"]:[]),...(ec===null?["ec=null"]:[])]),
  };
}

export function toInput(metrics:{metricName:string;metricValue:number|null}[],opts?:{fee?:number|null;follower_count?:number|null}):MetricInput {
  const m:Record<string,number|null>={};
  metrics.forEach(x=>{m[x.metricName]=x.metricValue;});
  return { likes:m["likes_count"]??null, comments:m["comments_count"]??null, shares:m["shares"]??null, video_views:m["video_views"]??null, follower_count:opts?.follower_count??null, fee:opts?.fee??null };
}

export function fmtKo(n:number|null):string { return n===null?"—":Math.round(n).toLocaleString("ko-KR"); }
export function fmtWon(n:number|null):string { return n===null?"—":"₩"+Math.round(n).toLocaleString("ko-KR"); }
export function fmtPct(n:number|null):string { return n===null?"—":n.toFixed(2)+"%"; }
