// Local-only Supabase settings boundary for UI tests. Production is never called.
async function mockSettingsPersistence(page) {
  await page.evaluate(()=>{
    window.supabase={};
    let stored;
    supabaseClient={from(table){
      if(table!=='game_settings')throw Error('Unexpected settings fixture table');
      return {write:false,one:false,payload:null,
        update(payload){this.write=true;this.payload=JSON.parse(JSON.stringify(payload.data));return this;},
        eq(){return this;},select(){return this;},single(){this.one=true;return this;},range(){return this;},order(){return this;},
        then(resolve){if(this.write)stored=this.payload;const row={id:1,data:stored||app.data.settings};return Promise.resolve(resolve({data:this.one?row:[row],error:null}));}
      };
    }};
  });
}
module.exports={mockSettingsPersistence};