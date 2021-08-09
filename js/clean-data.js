function reformatData(raw){
    // console.log(JSON.stringify(raw))
    
    let data = new Map()

    // add fake root
    data.set("@root",{id:"disciple1x1@root",name:"Disciple 1x1",teacher_id:null})
    
    // add students

    raw.forEach(x=>{
        data.set(x.student_email, {id:x.student_email,name: x.student_name ,teacher_id:x.teacher_email})
    })

    // decide roots and fake root
    const unique_teachers = new Set(raw.map(x=>x.teacher_email))
    
    unique_teachers.forEach(x=>{
        if(!data.has(x)){
            const teacher_data = raw.filter(y=>y.teacher_email == x)[0]
            data.set(x,{id:x,name:teacher_data.teacher_name,teacher_id:"@root"})
        }
    })

    // create the tree
    let root;
    data.forEach((value,key)=>{
        if(value.teacher_id == null){
            root = value
            return;
        }
        const teacherEl = data.get(value.teacher_id);
        teacherEl.children = [...(teacherEl.children || []), value];
    })

    // get nodes list

    const nodes = Array.from(data.values())

    return {
        nodes: nodes,
        tree: root
    }
}