function Draw(rawdata) {
  d3.select("#tree-svg").remove()
  let data = rawdata
  const width = 700;
  const height = 700;
  const radius = width / 2;

  const svg = d3
    .select("#tree")
    .append("svg")
    .attr("id","tree-svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", [0, 0, width, height])
    .style("background-color", "white")
    .style("box-sizing", "border-box")
    .style("font", "12px sans-serif");

  const g = svg.append("g");

  const linkgroup = g
    .append("g")
    .attr("id","group-links")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.8)
    .attr("stroke-width", 5);

  const nodegroup = g
    .append("g")
    .attr("id","group-nodes")
    .attr("stroke-linejoin", "round")
    .attr("stroke-width", 3);

  const tree = (data) =>
    d3
      .tree()
      .size([2 * Math.PI, radius])
      .separation((a, b) => (a.parent == b.parent ? 1 : 3) / a.depth)(
      d3.hierarchy(data)
    );

  d3.select("#brow")
    .selectAll("option")
    .data(data.nodes)
    .enter()
    .append("option")
    .attr("value", (d) => d.id);

  d3.select("#naming-root").on("change",(e)=>{
    let inputElement = document.getElementById("naming-root")
    const newName = inputElement.value
    if(newName !== ""){
      data.tree.name = newName
      data.tree.id = newName.toLowerCase()+"@root"
      
      data.nodes[0].name = newName
      data.nodes[0].id = newName.toLowerCase()+"@root"
      
      d3.selectAll("#tree-path").remove()
      d3.selectAll("#tree-node").remove()

      newdata(data.tree,false)

      d3.selectAll("#brow option").remove()

      d3.select("#brow")
        .selectAll("option")
        .data(data.nodes)
        .enter()
        .append("option")
        .attr("value", (d) => d.id);
      
      inputElement.placeholder = newName
    }
  })

  d3.select("#search-student").on("change", (e) => {
    const newRoot = document.getElementById("search-student").value
    if(data.nodes.map(d=>d.id).includes(newRoot)){
      const getData = (data)=>{
        const clone=JSON.parse(JSON.stringify(data))
        const newData = searchTree(clone,newRoot)
        return newData
      }
      const newTree = getData(data.tree)
      if(newTree.children){
        d3.selectAll("#tree-path").remove()
        d3.selectAll("#tree-node").remove()
        newdata(newTree,false)
      }
    }
  });

  d3.select("#download-svg").on("click",()=>{
    var svgString = getSVGString(svg.node());
    svgString2Image( svgString, 2*width, 2*height, 'png', save ); // passes Blob and filesize String to the callback

    function save( dataBlob, filesize ){
        saveAs( dataBlob, 'D3 vis exported to PNG.png' ); // FileSaver.js 
    }
  })

  newdata(data.tree,false);

  // Update tree
  function newdata(treeData,animate = true) {
    
    let root = tree(treeData)

    let links_data = root.links();

    let links = linkgroup
      .selectAll("path")
      .data(links_data, (d) => d.source.data.name + "_" + d.target.data.name);

    links.exit().remove();
    
    let nodeColors, darkerColor, brighterColor

    nodeColors = d3.scaleOrdinal().range(["#00965e","#e40046","#a05eb5","#ffc72c","#0066cc","#fb4075","#408dd9","#f6c580"])

    darkerColor = function (d) {
      return d3.rgb(nodeColors(d)).darker().toString();
    };

    brighterColor = function (d) {
      return d3.rgb(nodeColors(d)).brighter().toString();
    };

    // Map root's children color
    if(root.children){
      root.children.map(x=>x.data.id).forEach((id)=>{
        nodeColors(id)
      })
    }

    // 

    let newlinks = links
      .enter()
      .append("path")
      .attr("id","tree-path")
      .attr(
        "d",
        d3
          .linkRadial()
          .angle((d) => d.x)
          .radius(0.1)
      )
      .attr("stroke",(d)=>{
        const ancestors = d.target.ancestors()
        const ancestor = ancestors[ancestors.length-2].data.id

        return nodeColors(ancestor)
      })

    let t = d3
      .transition()
      .duration(animate ? 400 : 0)
      .ease(d3.easeLinear)
      .on("end", function () {
        const box = g.node().getBBox();
        svg
          .transition()
          .duration(1000)
          .attr("viewBox", `${-width / 2} ${-width / 2} ${width} ${width}`);
      });

    let alllinks = linkgroup.selectAll("path");

    alllinks.transition(t).attr(
      "d",
      d3
        .linkRadial()
        .angle((d) => d.x)
        .radius((d) => d.y)
    );

    let nodes_data = root.descendants().reverse();

    let nodes = nodegroup.selectAll("g").data(nodes_data, function (d) {
      if (d.parent) {
        return d.parent.data.name + d.data.name;
      }
      return d.data.name;
    });

    nodes.exit().remove();

    let newnodes = nodes.enter().append("g").attr("id","tree-node")

    let allnodes = animate
      ? nodegroup.selectAll("g").transition(t)
      : nodegroup.selectAll("g");
    allnodes.attr(
      "transform",
      (d) => `
        rotate(${(d.x * 180) / Math.PI - 90})
        translate(${d.y},0)
      `
    );

    newnodes
      .append("circle")
      .attr("r", 7.5)
      .on("click", function (event, d) {
        let altChildren = d.data.altChildren || [];
        let children = d.data.children;
        d.data.children = altChildren;
        d.data.altChildren = children;
        newdata(treeData);
      });
    nodegroup
      .selectAll("g circle")
      .attr("fill", function (d) {
        let altChildren = d.data.altChildren || [];
        let children = d.data.children;

        const ancestors = d.ancestors()
        
        let ancestor = d.data.id !== treeData.id? ancestors[ancestors.length-2].data.id: treeData.id

        return d.children ||
          (children && (children.length > 0 || altChildren.length > 0))
          ? darkerColor(ancestor)
          : brighterColor(ancestor)
      })
      .attr("class", "circle");

    newnodes
      .append("text")
      .attr("dy", "0.311em")
      .text((d) => d.data.name)
      .attr("class","tree-text")
      .clone(true)
      .lower()
      .attr("stroke", "white");

    nodegroup
      .selectAll("g text")
      .attr("x", (d) => (d.x < Math.PI === !d.children ? 9 : -9))
      .attr("text-anchor", (d) =>
        d.x < Math.PI === !d.children ? "start" : "end"
      )
      .attr("transform", (d) => (d.x >= Math.PI ? "rotate(180)" : null));
  }

   // ZOOM
   svg.call(
    d3
      .zoom()
      .extent([
        [0, 0],
        [width, height],
      ])
      .scaleExtent([0, 8])
      .on("zoom", zoomed)
  );

  function zoomed({ transform }) {
    g.attr(
      "transform",
      `translate(${transform.x},${transform.y})scale(${transform.k})`
    );
  }

  // Search Tree

  function searchTree(element, matchingId){
    if(element.id == matchingId){
         return element;
    }else if (element.children != null){
         var i;
         var result = null;
         for(i=0; result == null && i < element.children.length; i++){
              result = searchTree(element.children[i], matchingId);
         }
         return result;
    }
    return null;
  }


}
