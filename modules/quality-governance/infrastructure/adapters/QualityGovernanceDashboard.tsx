'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { motion } from 'framer-motion'

interface GraphNode {
  id: string
  name: string
  type: 'error' | 'pattern' | 'owner' | 'file'
  severity?: 'low' | 'medium' | 'high' | 'critical'
  occurrences?: number
  confidence?: number
  group: number
}

interface GraphLink {
  source: string
  target: string
  value: number
  type: 'causes' | 'owned_by' | 'affects' | 'related'
}

interface QualityGovernanceDashboardProps {
  nodes: GraphNode[]
  links: GraphLink[]
  width?: number
  height?: number
}

export function QualityGovernanceDashboard({
  nodes,
  links,
  width = 800,
  height = 600
}: QualityGovernanceDashboardProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)

  useEffect(() => {
    if (!svgRef.current || !nodes.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    // Create simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links as any).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30))

    // Create arrow markers
    const defs = svg.append('defs')

    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#999')

    // Create links
    const link = svg.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', (d) => getLinkColor(d.type))
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d) => Math.sqrt(d.value) * 2)
      .attr('marker-end', 'url(#arrowhead)')

    // Create nodes
    const node = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', (d) => getNodeRadius(d))
      .attr('fill', (d) => getNodeColor(d))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .call(d3.drag<SVGCircleElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        })
      )
      .on('click', (event, d) => setSelectedNode(d))
      .on('mouseover', (event, d) => setHoveredNode(d))
      .on('mouseout', () => setHoveredNode(null))

    // Add labels
    const labels = svg.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(nodes)
      .enter().append('text')
      .text((d) => d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name)
      .attr('font-size', 10)
      .attr('dx', 12)
      .attr('dy', 4)
      .attr('fill', '#333')

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y)

      labels
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y)
    })

    // Cleanup
    return () => {
      simulation.stop()
    }
  }, [nodes, links, width, height])

  const getNodeColor = (node: GraphNode): string => {
    switch (node.type) {
      case 'error':
        switch (node.severity) {
          case 'critical': return '#dc2626'
          case 'high': return '#ea580c'
          case 'medium': return '#ca8a04'
          case 'low': return '#16a34a'
          default: return '#6b7280'
        }
      case 'pattern':
        return `rgba(59, 130, 246, ${node.confidence || 0.5})`
      case 'owner':
        return '#8b5cf6'
      case 'file':
        return '#06b6d4'
      default:
        return '#6b7280'
    }
  }

  const getNodeRadius = (node: GraphNode): number => {
    if (node.occurrences) {
      return Math.max(8, Math.min(25, 8 + Math.sqrt(node.occurrences)))
    }
    if (node.confidence) {
      return Math.max(8, Math.min(20, 8 + node.confidence * 12))
    }
    return 10
  }

  const getLinkColor = (type: string): string => {
    switch (type) {
      case 'causes': return '#ef4444'
      case 'owned_by': return '#3b82f6'
      case 'affects': return '#f59e0b'
      case 'related': return '#10b981'
      default: return '#6b7280'
    }
  }

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-lg shadow-lg p-4"
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Grafo de Governança de Qualidade
        </h3>

        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="border border-gray-200 rounded"
        />

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded-full"></div>
            <span>Erro Crítico</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Padrão</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span>Owner</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
            <span>Arquivo</span>
          </div>
        </div>

        {/* Tooltip */}
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 right-4 bg-gray-900 text-white p-3 rounded-lg shadow-lg max-w-xs"
          >
            <h4 className="font-semibold">{hoveredNode.name}</h4>
            <p className="text-sm text-gray-300">Tipo: {hoveredNode.type}</p>
            {hoveredNode.severity && (
              <p className="text-sm text-gray-300">Severidade: {hoveredNode.severity}</p>
            )}
            {hoveredNode.occurrences && (
              <p className="text-sm text-gray-300">Ocorrências: {hoveredNode.occurrences}</p>
            )}
            {hoveredNode.confidence && (
              <p className="text-sm text-gray-300">
                Confiança: {(hoveredNode.confidence * 100).toFixed(1)}%
              </p>
            )}
          </motion.div>
        )}

        {/* Details Panel */}
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-4 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm"
          >
            <h4 className="font-semibold text-gray-800 mb-2">{selectedNode.name}</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Tipo:</strong> {selectedNode.type}</p>
              {selectedNode.severity && (
                <p><strong>Severidade:</strong> {selectedNode.severity}</p>
              )}
              {selectedNode.occurrences && (
                <p><strong>Ocorrências:</strong> {selectedNode.occurrences}</p>
              )}
              {selectedNode.confidence && (
                <p><strong>Confiança:</strong> {(selectedNode.confidence * 100).toFixed(1)}%</p>
              )}
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="mt-3 px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
            >
              Fechar
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
