(function(){
  var KF='cc_foods_v1', KL='cc_logs_v1';
  var foods=load(KF,null), logs=load(KL,{});
  if(!foods){foods=[
    {id:uid(),name:'Banana',mode:'piece',cal:105,p:1.3,c:27,fi:3.1,f:0.4},
    {id:uid(),name:'Moong dal (cooked)',mode:'gram',cal:105,p:7,c:19,fi:7.6,f:0.4}
  ];save(KF,foods)}
  var mode='piece';
  var $=function(i){return document.getElementById(i)};

  function load(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
  function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
  function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
  function r(n){return Math.round(n*10)/10}
  function num(id){var v=parseFloat($(id).value);return isNaN(v)||v<0?0:v}
  function esc(s){return s.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
  function day(){return $('date').value||today()}
  function unit(m){return m==='piece'?'pc':'g'}
  function factor(food,q){return food.mode==='piece'?q:q/100}
  function calc(food,q){var k=factor(food,q);return {cal:food.cal*k,p:food.p*k,c:food.c*k,fi:food.fi*k,f:food.f*k}}

  // mode toggle
  $('modeSeg').addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b)return;
    mode=b.dataset.m;
    [].forEach.call($('modeSeg').children,function(x){x.classList.toggle('on',x===b)});
  });

  // save food
  $('saveFood').addEventListener('click',function(){
    var name=$('fname').value.trim();
    if(!name){$('fmsg').textContent='Enter a food name first.';return}
    foods.push({id:uid(),name:name,mode:mode,cal:num('fcal'),p:num('fp'),c:num('fc'),fi:num('ffi'),f:num('ff')});
    save(KF,foods);
    ['fname','fcal','fp','fc','ffi','ff'].forEach(function(i){$(i).value=''});
    $('fmsg').textContent=name+' saved. Pick it from the list on the right.';
    $('foodSearch').value='';
    renderFoods();$('pick').value=foods[foods.length-1].id;updateQtyUI();
  });

  function renderFoods(){
    var sel=$('pick');
    var selectedId=sel.value;
    var words=$('foodSearch').value.trim().toLowerCase().split(/\s+/).filter(Boolean);

    // every typed word must appear somewhere in the food name
    var filtered=foods.filter(function(f){
      var n=f.name.toLowerCase();
      return words.every(function(w){return n.indexOf(w)!==-1});
    });

    sel.innerHTML=filtered.length
      ? filtered.map(function(f){
          return '<option value="'+f.id+'">'+esc(f.name)+' ('+(f.mode==='piece'?'per piece':'per 100 g')+')</option>';
        }).join('')
      : '<option value="">No matching foods</option>';

    // keep the current food if it is still in the results, otherwise pick the first match
    if(filtered.some(function(f){return f.id===selectedId})){
      sel.value=selectedId;
    }else if(filtered.length){
      sel.selectedIndex=0;
    }

    $('fcount').textContent=foods.length;
    $('foodList').innerHTML=foods.map(function(f){
      return '<li class="row"><div><div class="nm">'+esc(f.name)+'</div><div class="sub">'+f.cal+' kcal · P '+f.p+' · C '+f.c+' · Fi '+f.fi+' · F '+f.f+' / '+(f.mode==='piece'?'piece':'100 g')+'</div></div><button class="x" data-del="'+f.id+'" aria-label="Delete '+esc(f.name)+'">×</button></li>';
    }).join('')||'<li class="empty">Nothing saved yet.</li>';

    updateQtyUI();
  }
  $('foodSearch').addEventListener('input',renderFoods);
  $('foodList').addEventListener('click',function(e){
    var id=e.target.dataset.del;if(!id)return;
    foods=foods.filter(function(f){return f.id!==id});save(KF,foods);renderFoods();
  });

  function cur(){return foods.find(function(f){return f.id===$('pick').value})}

  function updateQtyUI(){
    var f=cur(),chips=$('chips');
    if(!f){chips.innerHTML='';$('preview').textContent='';return}
    var opts=f.mode==='piece'?[0.5,1,2,3,4]:[25,50,100,150,200];
    $('qtyLabel').textContent=f.mode==='piece'?'How many pieces':'How many grams';
    $('qty').step=f.mode==='piece'?'0.5':'10';
    chips.innerHTML=opts.map(function(o){return '<button type="button" data-q="'+o+'">'+o+(f.mode==='piece'?'':' g')+'</button>'}).join('');
    var q=parseFloat($('qty').value);
    if(!q||(f.mode==='gram'&&q<10)||(f.mode==='piece'&&q>20))$('qty').value=f.mode==='piece'?1:50;
    preview();
  }
  function preview(){
    var f=cur(),q=parseFloat($('qty').value)||0;
    if(!f){return}
    var n=calc(f,q);
    $('preview').textContent=r(n.cal)+' kcal · P '+r(n.p)+' · C '+r(n.c)+' · Fi '+r(n.fi)+' · F '+r(n.f);
  }
  $('chips').addEventListener('click',function(e){var q=e.target.dataset.q;if(q){$('qty').value=q;preview()}});
  $('qty').addEventListener('input',preview);
  $('pick').addEventListener('change',function(){var f=cur();$('qty').value=f&&f.mode==='gram'?50:1;updateQtyUI()});

  // log
  $('addLog').addEventListener('click',function(){
    var f=cur(),q=parseFloat($('qty').value);
    if(!f||!q||q<=0)return;
    var n=calc(f,q),d=day();
    (logs[d]=logs[d]||[]).push({id:uid(),name:f.name,mode:f.mode,qty:q,cal:n.cal,p:n.p,c:n.c,fi:n.fi,f:n.f});
    save(KL,logs);renderLog();
  });
  $('logList').addEventListener('click',function(e){
    var id=e.target.dataset.rm;if(!id)return;
    var d=day();logs[d]=(logs[d]||[]).filter(function(x){return x.id!==id});save(KL,logs);renderLog();
  });
  $('clearDay').addEventListener('click',function(){
    var d=day();if(!(logs[d]||[]).length)return;
    if(confirm('Remove everything logged on '+d+'?')){delete logs[d];save(KL,logs);renderLog()}
  });
  $('date').addEventListener('change',renderLog);

  function renderLog(){
    var items=logs[day()]||[],t={cal:0,p:0,c:0,fi:0,f:0};
    items.forEach(function(x){t.cal+=x.cal;t.p+=x.p;t.c+=x.c;t.fi+=x.fi;t.f+=x.f});
    $('logList').innerHTML=items.map(function(x){
      return '<li class="row"><div><div class="nm">'+esc(x.name)+' · '+x.qty+(x.mode==='piece'?' pc':' g')+'</div><div class="sub">'+r(x.cal)+' kcal · P '+r(x.p)+' · C '+r(x.c)+' · Fi '+r(x.fi)+' · F '+r(x.f)+'</div></div><button class="x" data-rm="'+x.id+'" aria-label="Remove '+esc(x.name)+'">×</button></li>'}).join('')||'<li class="empty">Nothing logged for this day. Pick a food above and add it.</li>';
    $('tCal').textContent=Math.round(t.cal);
    $('tP').textContent=r(t.p);$('tC').textContent=r(t.c);$('tFi').textContent=r(t.fi);$('tF').textContent=r(t.f);
  }

  $('date').value=today();
  renderFoods();renderLog();
})();